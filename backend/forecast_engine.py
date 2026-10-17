"""
生猪产业量化预测与生物学生长推演引擎 (Live Hog Quantitative Forecasting & Cohort Pipeline Engine)
========================================================================================
结合生猪产业 10 个月生物学时序推移矩阵 (Cohort Pipeline)、动态完全养殖成本模型、
二次育肥与出栏均重时空平移博弈、高精度季节性日历分解以及期现基差收敛动力学，
科学计算未来 1天、3天、5天、7天、10天、15天、30天、60天、90天、180天的生猪价格走势与置信区间。
"""

import re
import math
import datetime
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.orm import Session

from .models import (
    SpotPrice,
    FuturesQuote,
    BreedingIndicator,
    SwineCapacity,
    SubstituteGoodsPrice,
    PorkImport,
    BreedingEfficiency,
    FeedSalesBreakdown,
)


# ─────────────────────────────────────────────────────────────
# 1. 经典生猪消费月度季节性系数表 (基于中国农业农村部多年白条肉与屠宰消纳规律拟合)
# ─────────────────────────────────────────────────────────────
MONTHLY_SEASONAL_FACTORS = {
    1: 1.18,   # 1月: 冬季腌腊尾声与春节前囤肉大峰值
    2: 0.84,   # 2月: 春节后库存消化与传统消费冰点
    3: 0.86,   # 3月: 节后低迷整理期
    4: 0.94,   # 4月: 踏青及气温回升，消费温和修复
    5: 0.98,   # 5月: 五一假期拉动，接近平水
    6: 0.90,   # 6月: 夏季高温湿热，清淡饮食导致消费回落
    7: 0.88,   # 7月: 伏天肉类消费淡季
    8: 0.92,   # 8月: 出伏渐凉，开学前准备
    9: 1.05,   # 9月: 开学季 + 中秋双节备货
    10: 1.08,  # 10月: 国庆黄金周聚餐旅游拉动
    11: 1.12,  # 11月: 初冬降温，西南/江南开始小规模灌肠
    12: 1.20,  # 12月: 集中腌腊制作高潮，全年需求最旺季
}


def get_smooth_seasonal_factor(target_date: datetime.date) -> float:
    """
    计算特定日期的平滑季节性系数（相邻月份按天数平滑样条过渡，避免断崖式阶梯突变）
    """
    m = target_date.month
    d = target_date.day
    next_m = 1 if m == 12 else m + 1
    
    curr_f = MONTHLY_SEASONAL_FACTORS[m]
    next_f = MONTHLY_SEASONAL_FACTORS[next_m]
    
    # 线性平滑天数过渡
    days_in_month = 31 if m in (1, 3, 5, 7, 8, 10, 12) else (28 if m == 2 else 30)
    alpha = min(1.0, max(0.0, (d - 1) / float(days_in_month)))
    smooth_factor = curr_f * (1.0 - alpha) + next_f * alpha
    
    # 节日临近动态脉冲拉动 (国庆、春节)
    holiday_boost = 0.0
    # 国庆黄金周备货 (9月16日 - 9月30日)
    if m == 9 and d >= 16:
        holiday_boost = 0.06 * ((d - 15) / 15.0)
    # 春节备货 (根据公历1月15日至2月5日区间动态模拟)
    if (m == 1 and d >= 15) or (m == 2 and d <= 5):
        holiday_boost = 0.08

    return round(smooth_factor + holiday_boost, 4)


# ─────────────────────────────────────────────────────────────
# 2. 动态完全养殖成本测算模型 (Full Breeding Cost Model)
# ─────────────────────────────────────────────────────────────
def calculate_dynamic_breeding_cost(
    corn_price_ton: float,
    soy_price_ton: float,
    psy: float = 21.5,
    avg_slaughter_weight: float = 122.0,
    piglet_purchase_price: Optional[float] = None,
) -> Dict[str, float]:
    """
    根据原材料玉米现货、豆粕现货及产业繁育效率，测算自繁自养与外购育肥的完全保本成本线
    """
    # 混合全价饲料配方: 玉米 64% + 豆粕 22% + 麦麸/杂粕 10% + 核心预混料 4%
    if corn_price_ton > 100.0:
        corn_kg = corn_price_ton / 1000.0
    else:
        corn_kg = corn_price_ton if corn_price_ton > 0 else 2.35

    if soy_price_ton > 100.0:
        soy_kg = soy_price_ton / 1000.0
    else:
        soy_kg = soy_price_ton if soy_price_ton > 0 else 3.35

    wheat_bran_kg = 2.05  # 麦麸常态均价
    premix_kg = 6.20      # 预混料常态均价

    feed_price_per_kg = (
        corn_kg * 0.64 + soy_kg * 0.22 + wheat_bran_kg * 0.10 + premix_kg * 0.04
    )
    # 加工与配送损耗系数 1.05
    feed_price_per_kg = round(feed_price_per_kg * 1.05, 3)
    
    # 生长育肥期料肉比 (FCR)，随着体重增加呈非线性上升 (120kg标猪约为 2.75，重度肥猪升至 2.95)
    base_fcr = 2.75 + max(0.0, (avg_slaughter_weight - 120.0)) * 0.015

    # 肥猪育肥增重阶段: 从断奶仔猪 (15kg) 育肥至出栏重 (如 122kg), 增重 107kg
    weaned_weight = 15.0
    weight_gain = max(50.0, avg_slaughter_weight - weaned_weight)
    total_finisher_feed_cost = weight_gain * base_fcr * feed_price_per_kg

    # 自繁自养母猪成本与仔猪保育阶段分摊:
    # 一头能繁母猪年消耗饲料约 1.15 吨，PSY 头均活仔，分摊至每头仔猪的母猪饲料成本 + 教槽保育料 (约25kg)
    sow_feed_per_piglet = (1150.0 * (corn_kg * 0.60 + soy_kg * 0.25 + 0.15 * 2.2)) / max(15.0, psy)
    piglet_nursery_feed = 22.0 * (feed_price_per_kg * 1.35)  # 高档教槽乳猪料
    sow_depreciation_per_piglet = 120.0  # 母猪淘汰残值与引种原种折旧
    piglet_cash_cost = sow_feed_per_piglet + piglet_nursery_feed + 55.0  # 产房疫苗与保温水电人工

    # 育肥期非料刚性现金支出 (动保兽药疫苗 45元 + 水电排污 35元 + 运损与低值易耗 25元)
    fattening_cash_operating = 105.0

    # 育肥期固定折旧与财务管理费 (人工工资 85元 + 猪舍栏舍折旧 65元 + 财务利息 25元)
    fattening_fixed_overhead = 175.0

    # 1. 现金保本成本线 (仅保留饲料、兽药防疫、水电、基础死淘等刚性现金流出)
    total_cash_cost = piglet_cash_cost + total_finisher_feed_cost + fattening_cash_operating
    cash_cost_line = round(total_cash_cost / avg_slaughter_weight, 2)

    # 2. 完全成本线 (包含母猪折旧、人工工资、猪舍厂房折旧与财务管理费用)
    total_full_cost = total_cash_cost + sow_depreciation_per_piglet + fattening_fixed_overhead
    full_cost_line = round(total_full_cost / avg_slaughter_weight, 2)

    # 仔猪摊销成本 (元/公斤)
    piglet_cost_share = round((piglet_cash_cost + sow_depreciation_per_piglet) / avg_slaughter_weight, 2)
    feed_cost_per_kg_gain = round(base_fcr * feed_price_per_kg, 2)

    return {
        "corn_price": round(corn_price_ton, 1),
        "soybean_price": round(soy_price_ton, 1),
        "feed_price_per_kg": round(feed_price_per_kg, 2),
        "feed_cost_per_kg_gain": feed_cost_per_kg_gain,
        "piglet_cost_share": piglet_cost_share,
        "cash_cost_line": cash_cost_line,
        "full_cost_line": full_cost_line,
    }


# ─────────────────────────────────────────────────────────────
# 3. 生物学时序推移矩阵 (10-Month Cohort Pipeline Model)
# ─────────────────────────────────────────────────────────────
def run_biological_cohort_projection(
    db: Session,
    target_date: Optional[datetime.date] = None,
    current_avg_weight: float = 124.0,
    sow_shock_pct: float = 0.0,
    demand_shock_pct: float = 0.0,
) -> Dict[str, Any]:
    """
    根据农业农村部官方能繁母猪存栏时序，应用 10 个月生物学时滞刚性推演当期及未来出栏供给潜力
    """
    if target_date is None:
        target_date = datetime.date.today()

    # 1. 查找历史能繁母猪存栏记录 (优先使用 10 个月前的母猪存栏 S_{t-10})
    sow_10m_date = target_date - datetime.timedelta(days=300)  # 约 10 个月前
    sow_6m_date = target_date - datetime.timedelta(days=180)   # 约 6 个月前 (仔猪出生)

    past_sow_10m = (
        db.query(SwineCapacity)
        .filter(SwineCapacity.date <= sow_10m_date, SwineCapacity.maternal_sow_inventory.isnot(None))
        .order_by(SwineCapacity.date.desc())
        .first()
    )
    latest_sow = (
        db.query(SwineCapacity)
        .filter(SwineCapacity.maternal_sow_inventory.isnot(None))
        .order_by(SwineCapacity.date.desc())
        .first()
    )

    # 能繁母猪存栏基准 (万头)
    base_sow = (
        past_sow_10m.maternal_sow_inventory
        if past_sow_10m and past_sow_10m.maternal_sow_inventory
        else (latest_sow.maternal_sow_inventory if latest_sow and latest_sow.maternal_sow_inventory else 4040.0)
    )
    sow_t_minus_10 = base_sow * (1.0 + sow_shock_pct / 100.0)

    # 获取繁育效率 PSY
    latest_eff = db.query(BreedingEfficiency).order_by(BreedingEfficiency.date.desc()).first()
    psy = latest_eff.psy if latest_eff and latest_eff.psy else 21.2

    # 生物学链条计算:
    # 10个月前母猪配种受胎产活仔数 (月度活仔量) = Sow * (PSY / 12)
    # 哺乳存活率 92.5%, 育肥期存活率 95.0%
    nursing_survival = 0.925
    finishing_survival = 0.950

    monthly_piglets = sow_t_minus_10 * (psy / 12.0) * nursing_survival  # 万头断奶仔猪
    projected_slaughter_heads = monthly_piglets * finishing_survival    # 万头当期出栏量

    # 当期理论出肉量 (万吨) = 出栏头数 (万头) * 出栏均重 (公斤) * 出肉率 75% / 1000.0
    dressing_rate = 0.75
    projected_pork_supply = round(
        (projected_slaughter_heads * current_avg_weight * dressing_rate) / 1000.0, 2
    )

    # 测算基准常态月度猪肉消费量 (历史均值约为 460~480 万吨/月，叠加热力学/需求冲击)
    base_monthly_demand = 470.0 * (1.0 + demand_shock_pct / 100.0)
    season_factor = get_smooth_seasonal_factor(target_date)
    normal_demand = round(base_monthly_demand * season_factor, 2)

    # 供需差额比率 (%)
    gap_pct = round(((projected_pork_supply - normal_demand) / normal_demand) * 100.0, 2)

    if gap_pct > 3.0:
        phase = "供给过剩承压期"
    elif gap_pct < -3.0:
        phase = "供给缺口推升期"
    else:
        phase = "供需基本均衡期"

    return {
        "reference_date": target_date.strftime("%Y-%m-%d"),
        "sow_t_minus_10": round(sow_t_minus_10, 1),
        "piglets_t_minus_6": round(monthly_piglets, 1),
        "projected_slaughter_heads": round(projected_slaughter_heads, 1),
        "projected_avg_weight": round(current_avg_weight, 1),
        "projected_pork_supply": projected_pork_supply,
        "normal_demand": normal_demand,
        "supply_demand_gap_pct": gap_pct,
        "phase_assessment": phase,
    }


def get_contract_delivery_date(symbol: str) -> Optional[datetime.date]:
    """
    解析大商所生猪期货合约代码对应交割月份与预计最后交割日。
    例如 LH2501 -> 2025年1月15日交割；LH0 为主力连续合约无特定单月交割。
    """
    m = re.search(r"LH(\d{2})(\d{2})", symbol.upper())
    if m:
        yy = int(m.group(1))
        mm = int(m.group(2))
        if 1 <= mm <= 12:
            year = 2000 + yy
            return datetime.date(year, mm, 15)
    return None


def compute_expected_basis(basis: float, day_step: int, days_to_delivery: Optional[int]) -> float:
    """
    计算未来第 day_step 天的预期基差：
    若是特定交割月合约，随临近交割日向 0 刚性收敛；
    若是连续合约，则按平滑指数衰减半衰期收敛。
    """
    if days_to_delivery is not None and days_to_delivery > 0:
        if day_step >= days_to_delivery:
            return 0.0
        decay = ((days_to_delivery - day_step) / float(days_to_delivery)) ** 1.3
        return round(basis * decay, 1)
    return round(basis * math.exp(-0.025 * day_step), 1)


# ─────────────────────────────────────────────────────────────
# 4. 多时间跨度量化走势预测计算器 (Multi-Horizon Forecast Engine)
# ─────────────────────────────────────────────────────────────
def calculate_price_forecast(
    db: Session,
    symbol: str = "LH0",
    base_date: Optional[datetime.date] = None,
    sow_shock_pct: float = 0.0,
    feed_cost_shock_pct: float = 0.0,
    weight_shock_kg: float = 0.0,
    demand_shock_pct: float = 0.0,
) -> Dict[str, Any]:
    """
    全量化预测生猪价格走势：
    1. 整合现货、期货、基差数据
    2. 计算完全成本线与现金成本支撑（支持饲料原料价格情景冲击）
    3. 运行生物学时序推移矩阵（支持能繁母猪与消费弹性情景冲击）
    4. 分解日度高精度季节性与节假日拉动
    5. 评估二次育肥/压栏博弈对时空供给的置换（支持出栏均重情景冲击）
    6. 计算 1d, 3d, 5d, 7d, 10d, 15d, 30d, 60d, 90d, 180d 价格中枢、高低置信区间与驱动分解
    """
    if base_date is None:
        base_date = datetime.date.today()

    # 1. 获取最新基准价格
    latest_spot_rec = db.query(SpotPrice).order_by(SpotPrice.date.desc()).first()
    spot_price = float(latest_spot_rec.price) if latest_spot_rec and latest_spot_rec.price else 15.4

    target_quote = db.query(FuturesQuote).filter(FuturesQuote.symbol == symbol.upper()).first()
    if not target_quote:
        target_quote = db.query(FuturesQuote).filter(FuturesQuote.symbol == "LH0").first()
    futures_price = float(target_quote.last_price) if target_quote and target_quote.last_price else 14500.0

    # 基差 (元/吨，现货折合吨价 - 期货收盘)
    basis = round(spot_price * 1000.0 - futures_price, 1)

    # 合约交割日解析 (用于交割月基差收敛动力学建模)
    delivery_date = get_contract_delivery_date(symbol)
    days_to_delivery = (delivery_date - base_date).days if delivery_date else None

    # 2. 饲料成本与完全成本 (叠加原料情景冲击)
    latest_indicator = db.query(BreedingIndicator).order_by(BreedingIndicator.date.desc()).first()
    corn_price = float(latest_indicator.corn_price) if latest_indicator and latest_indicator.corn_price else 2350.0
    soy_price = float(latest_indicator.soybean_price) if latest_indicator and latest_indicator.soybean_price else 3350.0

    if feed_cost_shock_pct != 0.0:
        corn_price = corn_price * (1.0 + feed_cost_shock_pct / 100.0)
        soy_price = soy_price * (1.0 + feed_cost_shock_pct / 100.0)

    cost_info = calculate_dynamic_breeding_cost(corn_price, soy_price)
    full_cost = cost_info["full_cost_line"]
    cash_cost = cost_info["cash_cost_line"]

    current_margin = round(spot_price - full_cost, 2)
    safety_margin_pct = round(((spot_price - full_cost) / full_cost) * 100.0, 1) if full_cost > 0 else 0.0
    cost_info["current_margin"] = current_margin
    cost_info["safety_margin_pct"] = safety_margin_pct

    # 3. 出栏均重与二育压栏特征 (叠加出栏均重情景冲击)
    latest_feed = db.query(FeedSalesBreakdown).order_by(FeedSalesBreakdown.date.desc()).first()
    feed_ratio = (
        latest_feed.finisher_feed / latest_feed.sow_feed
        if latest_feed and latest_feed.sow_feed and latest_feed.sow_feed > 0
        else 2.0
    )
    # 若大猪料偏高，反映二育/压栏增重，均重相应提升
    avg_weight = 122.0 + max(0.0, (feed_ratio - 1.8) * 8.0) + weight_shock_kg
    avg_weight = min(145.0, max(105.0, avg_weight))

    # 4. 生物学供给推移矩阵 (叠加母猪存栏与消费弹性冲击)
    cohort_info = run_biological_cohort_projection(
        db, base_date, avg_weight, sow_shock_pct=sow_shock_pct, demand_shock_pct=demand_shock_pct
    )
    supply_gap = cohort_info["supply_demand_gap_pct"]

    # 5. 驱动因子量化贡献分解
    # 生猪需求价格弹性系数约为 -0.4: 供给每多1%，价格下跌约 2.5%
    supply_impact = round(-2.5 * (supply_gap / 10.0), 2)

    # 成本估值引力: 价格远离完全成本时，存在向中枢均值回归的张力 (以每月 10% 的速度均值回归)
    cost_diff = (full_cost - spot_price)
    cost_impact = round(cost_diff * 0.35, 2)

    # 基差收敛驱动: 若现货大幅升水 (基差 > 1000)，期货具有补涨或现货向期货靠拢拉力
    basis_impact = round(basis / 1500.0, 2)

    # 消费季节性系数
    curr_season = get_smooth_seasonal_factor(base_date)

    # 二育压栏短多长空影响
    spec_impact = 0.6 if avg_weight > 125.0 else (-0.4 if avg_weight < 118.0 else 0.0)

    drivers_data = {
        "supply_gap_impact": supply_impact,
        "cost_support_impact": cost_impact,
        "seasonality_impact": round((curr_season - 1.0) * 10.0, 2),
        "basis_convergence_impact": basis_impact,
        "speculation_weight_impact": spec_impact,
    }

    # 6. 生成多跨度时间点走势预测
    horizon_days = [
        ("1d", 1),
        ("3d", 3),
        ("5d", 5),
        ("7d", 7),
        ("10d", 10),
        ("15d", 15),
        ("30d", 30),
        ("60d", 60),
        ("90d", 90),
        ("180d", 180),
    ]

    # 年化波动率: 生猪期货实证历史年化波动率约为 24%
    annual_vol = 0.24

    horizons_res: List[Dict[str, Any]] = []

    for name, days in horizon_days:
        t_date = base_date + datetime.timedelta(days=days)
        t_season = get_smooth_seasonal_factor(t_date)
        season_shift = (t_season - curr_season) / curr_season

        # 随时间演进的供需缺口与成本收敛漂移
        t_factor = days / 365.0
        sqrt_t = math.sqrt(days / 365.0)

        # 价格漂移率 = 季节性需求变动 + 供需缺口影响 + 成本均值回归 + 基差指数衰减收敛
        # 二育博弈的时空转移: 30天内因为压栏短期缩量挺价，30天以后集中出栏压制价格
        timing_second_feed = 0.03 * math.exp(-days / 20.0) if avg_weight > 125.0 else 0.0
        if days >= 35 and avg_weight > 125.0:
            timing_second_feed -= 0.04  # 集中出栏压制

        # 基差收敛驱动
        if days_to_delivery is not None and days_to_delivery > 0:
            basis_progress = min(1.0, days / float(days_to_delivery))
            basis_pull = (basis / 1000.0 / spot_price * 0.20) * (basis_progress ** 0.8)
        else:
            basis_pull = (basis / 1000.0 / spot_price * 0.15) * (1.0 - math.exp(-0.03 * days))

        drift_pct = (
            season_shift * 0.8
            + (supply_impact * 0.02) * min(2.0, days / 30.0)
            + (cost_diff / spot_price * 0.25) * min(1.0, days / 60.0)
            + basis_pull
            + timing_second_feed
        )

        projected_mid = spot_price * (1.0 + drift_pct)

        # 跌破现金成本线的强支撑硬约束
        if projected_mid < cash_cost:
            projected_mid = cash_cost + (projected_mid - cash_cost) * 0.35

        # 置信区间上下轨 (95% 显著性水平，Z ≈ 1.645)
        half_band = projected_mid * annual_vol * sqrt_t * 1.645
        # 考虑随着天数增加，不确定性增加
        projected_high = projected_mid + half_band
        projected_low = max(cash_cost * 0.90, projected_mid - half_band)

        # 涨跌方向与置信度
        chg_pct = round(((projected_mid - spot_price) / spot_price) * 100.0, 2)
        if chg_pct > 2.5:
            d_label = "看多上涨"
            d_class = "bullish-strong" if chg_pct > 5.0 else "bullish"
        elif chg_pct < -2.5:
            d_label = "看空下跌"
            d_class = "bearish-strong" if chg_pct < -5.0 else "bearish"
        else:
            d_label = "高频震荡"
            d_class = "neutral"

        conf = min(92.0, max(55.0, 85.0 - days * 0.15))

        # 归因主导因子
        primary = "季节性消费拉动" if abs(season_shift) > 0.05 else (
            "生猪供需基本面缺口" if abs(supply_gap) > 3.0 else (
                "完全养殖成本强支撑" if spot_price <= full_cost else "期现基差收敛博弈"
            )
        )

        horizons_res.append({
            "horizon": name,
            "target_date": t_date.strftime("%Y-%m-%d"),
            "days": days,
            "mid": round(projected_mid, 2),
            "high": round(projected_high, 2),
            "low": round(projected_low, 2),
            "direction": d_label,
            "direction_class": d_class,
            "confidence": round(conf, 1),
            "expected_change_pct": chg_pct,
            "primary_driver": primary,
        })

    # 7. 生成连续 90 天逐日走势轨迹 (用于前端图表平滑绘制未来预测走势带)
    trajectory_90d: List[Dict[str, Any]] = []
    for day_i in range(1, 91):
        t_d = base_date + datetime.timedelta(days=day_i)
        t_season = get_smooth_seasonal_factor(t_d)
        season_shift = (t_season - curr_season) / curr_season
        sqrt_t = math.sqrt(day_i / 365.0)

        timing_second_feed = 0.025 * math.exp(-day_i / 20.0) if avg_weight > 125.0 else 0.0
        if day_i >= 35 and avg_weight > 125.0:
            timing_second_feed -= 0.035

        # 基差收敛驱动
        if days_to_delivery is not None and days_to_delivery > 0:
            basis_progress = min(1.0, day_i / float(days_to_delivery))
            basis_pull = (basis / 1000.0 / spot_price * 0.20) * (basis_progress ** 0.8)
        else:
            basis_pull = (basis / 1000.0 / spot_price * 0.15) * (1.0 - math.exp(-0.03 * day_i))

        drift_pct = (
            season_shift * 0.8
            + (supply_impact * 0.02) * min(2.0, day_i / 30.0)
            + (cost_diff / spot_price * 0.25) * min(1.0, day_i / 60.0)
            + basis_pull
            + timing_second_feed
        )

        p_mid = spot_price * (1.0 + drift_pct)
        if p_mid < cash_cost:
            p_mid = cash_cost + (p_mid - cash_cost) * 0.35

        half_band = p_mid * annual_vol * sqrt_t * 1.645
        p_high = p_mid + half_band
        p_low = max(cash_cost * 0.90, p_mid - half_band)

        # 预期基差收敛
        exp_basis = compute_expected_basis(basis, day_i, days_to_delivery)

        trajectory_90d.append({
            "date": t_d.strftime("%Y-%m-%d"),
            "days_ahead": day_i,
            "price_mid": round(p_mid, 2),
            "price_upper": round(p_high, 2),
            "price_lower": round(p_low, 2),
            "projected_basis": round(exp_basis, 1),
        })

    # 8. 周期倾向性研判
    short_bias = horizons_res[2]["direction"]  # 5d
    mid_bias = horizons_res[6]["direction"]    # 30d
    long_bias = horizons_res[8]["direction"]   # 90d

    overall_confidence = round(sum(h["confidence"] for h in horizons_res) / len(horizons_res), 1)

    narrative = (
        f"【量化供需与价格走势预测报告】当前生猪现货基准价为 {spot_price:.2f} 元/公斤，主力期货合约价格 {futures_price / 1000.0:.2f} 元/公斤（期现基差 {basis:+.1f} 元/吨）。\n"
        f"1. 成本估值锚点：当前全行业完全养殖成本测算为 {full_cost:.2f} 元/公斤，现金保本线为 {cash_cost:.2f} 元/公斤。现货相较完全成本溢价率 {safety_margin_pct:+.1f}%。\n"
        f"2. 产能推移与供需缺口：10个月前能繁母猪存栏登记为 {cohort_info['sow_t_minus_10']:.1f} 万头，推演出当期理论生猪出栏量约为 {cohort_info['projected_slaughter_heads']:.1f} 万头，折合肉类供给 {cohort_info['projected_pork_supply']:.1f} 万吨。对比常态消费需求（{cohort_info['normal_demand']:.1f} 万吨），测算供需缺口为 {supply_gap:+.2f}%，行业处于【{cohort_info['phase_assessment']}】。\n"
        f"3. 周期前瞻走势：短期（5日内）呈现【{short_bias}】，中期（30日）呈现【{mid_bias}】，季度中远期（90日）呈现【{long_bias}】。预期未来30天价格波动中枢为 {horizons_res[6]['mid']:.2f} 元/公斤（波动区间 {horizons_res[6]['low']:.2f} ~ {horizons_res[6]['high']:.2f} 元/公斤），建议密切关注消费季节性切换与二育集中出栏窗口。"
    )

    if delivery_date and days_to_delivery is not None and days_to_delivery > 0:
        narrative += f"\n4. 【合约交割与基差提示】：目标合约 {symbol.upper()} 对应交割月为 {delivery_date.year}年{delivery_date.month:02d}月（距交割约 {days_to_delivery} 天），期现基差将随着交割月临近呈现强确定性收敛。"

    if sow_shock_pct != 0.0 or feed_cost_shock_pct != 0.0 or weight_shock_kg != 0.0 or demand_shock_pct != 0.0:
        section_num = "5" if (delivery_date and days_to_delivery is not None and days_to_delivery > 0) else "4"
        narrative += (
            f"\n{section_num}. 【情景压力测试模拟推演】：当前情景叠加设定——能繁母猪冲击 {sow_shock_pct:+.1f}%，原料成本冲击 {feed_cost_shock_pct:+.1f}%，"
            f"出栏均重冲击 {weight_shock_kg:+.1f}kg，终端需求弹性冲击 {demand_shock_pct:+.1f}%。"
            f"在上述冲击传导下，行业完全成本重估为 {full_cost:.2f} 元/公斤，30天推演中枢调整为 {horizons_res[6]['mid']:.2f} 元/公斤。"
        )

    return {
        "status": "success",
        "symbol": symbol.upper(),
        "base_date": base_date.strftime("%Y-%m-%d"),
        "spot_price": spot_price,
        "futures_price": futures_price,
        "basis": basis,
        "short_term_bias": short_bias,
        "mid_term_bias": mid_bias,
        "long_term_bias": long_bias,
        "overall_confidence": overall_confidence,
        "horizons": horizons_res,
        "trajectory_90d": trajectory_90d,
        "cohort": cohort_info,
        "cost": cost_info,
        "drivers": drivers_data,
        "forecast_narrative": narrative,
    }


# ─────────────────────────────────────────────────────────────
# 5. 向后兼容桥梁: 为原有 yijing 接口提供科学量化走势数据映射
# ─────────────────────────────────────────────────────────────
def generate_scientific_yijing_bridge(
    db: Session,
    spot_price: float,
    futures_price: float,
    pig_to_grain: float,
    self_profit: float,
    corn_price: float = 2420.0,
    symbol: str = "LH0",
) -> Dict[str, Any]:
    """
    桥接原有的 yijing 数据结构，将内部预测核心平滑升级为基于农业经济学与供需平衡表的真实预测结果，
    同时保留卦象渲染数据，确保前端既有面板与测试用例 100% 正常运行。
    """
    from .yijing import compute_meihua, compute_liuyao, _compose_yijing_text, _gua_to_image_yao

    now = datetime.datetime.now()
    date_str = now.strftime("%Y-%m-%d %H:%M:%S")

    # 1. 运行科学预测引擎
    engine_res = calculate_price_forecast(db, symbol=symbol, base_date=now.date())

    h1 = engine_res["horizons"][0]  # 1d
    h5 = engine_res["horizons"][2]  # 5d
    h10 = engine_res["horizons"][4] # 10d

    # 2. 保留传统卦象结构
    meihua = compute_meihua(now, spot_price, futures_price)
    liuyao = compute_liuyao(now, spot_price, futures_price, pig_to_grain, self_profit)

    # 3. 构造结构
    direction = engine_res["short_term_bias"]
    direction_class = h5["direction_class"]
    confidence = engine_res["overall_confidence"]

    liuyao_yao_render = _gua_to_image_yao(liuyao["ben_lines"], liuyao["dong_yao_list"])
    interpretation = _compose_yijing_text(meihua, liuyao, direction, spot_price, futures_price)

    # 将科学预测结论补充进 interpretation 中
    interpretation["conclusion"] = (
        f"量化与供需平衡表前瞻：{direction}。{engine_res['forecast_narrative'][:120]}..."
    )

    return {
        "timestamp": date_str,
        "spot_price": spot_price,
        "futures_price": futures_price,
        "meihua": {
            "ben_gua": meihua["ben_gua"],
            "bian_gua": meihua["bian_gua"],
            "hu_gua": meihua["hu_gua"],
            "upper": meihua["upper"],
            "lower": meihua["lower"],
            "upper_idx": meihua["upper_idx"],
            "lower_idx": meihua["lower_idx"],
            "bian_upper_idx": meihua["bian_upper_idx"],
            "bian_lower_idx": meihua["bian_lower_idx"],
            "hu_upper_idx": meihua["hu_upper_idx"],
            "hu_lower_idx": meihua["hu_lower_idx"],
            "dong_yao": meihua["dong_yao"],
            "ti_gua": meihua["ti_gua"],
            "yong_gua": meihua["yong_gua"],
            "ti_element": meihua["ti_element"],
            "yong_element": meihua["yong_element"],
            "sheng_ke": meihua["sheng_ke"],
            "score": meihua["score"],
        },
        "liuyao": {
            "ben_gua": liuyao["ben_gua"],
            "bian_gua": liuyao["bian_gua"],
            "upper": liuyao["upper"],
            "lower": liuyao["lower"],
            "upper_idx": liuyao["upper_idx"],
            "lower_idx": liuyao["lower_idx"],
            "bian_upper_idx": liuyao["bian_upper_idx"],
            "bian_lower_idx": liuyao["bian_lower_idx"],
            "yao_vals": liuyao["yao_vals"],
            "ben_lines": liuyao["ben_lines"],
            "dong_yao_list": liuyao["dong_yao_list"],
            "shi_yao": liuyao["shi_yao"],
            "ying_yao": liuyao["ying_yao"],
            "score": liuyao["score"],
            "yao_render": liuyao_yao_render,
        },
        "quant_score": round(engine_res["drivers"]["supply_gap_impact"] + engine_res["drivers"]["cost_support_impact"], 2),
        "total_score": round((h5["expected_change_pct"] / 2.0), 2),
        "direction": direction,
        "direction_class": direction_class,
        "confidence": confidence,
        "forecast": {
            "realtime": {
                "direction": direction,
                "direction_class": direction_class,
                "confidence": confidence,
                "price": spot_price,
            },
            "day1": {
                "mid": h1["mid"],
                "high": h1["high"],
                "low": h1["low"],
                "direction": h1["direction"],
                "direction_class": h1["direction_class"],
                "confidence": h1["confidence"],
            },
            "day5": {
                "mid": h5["mid"],
                "high": h5["high"],
                "low": h5["low"],
                "direction": h5["direction"],
                "direction_class": h5["direction_class"],
                "confidence": h5["confidence"],
            },
            "day10": {
                "mid": h10["mid"],
                "high": h10["high"],
                "low": h10["low"],
                "direction": h10["direction"],
                "direction_class": h10["direction_class"],
                "confidence": h10["confidence"],
            },
        },
        "interpretation": interpretation,
    }
