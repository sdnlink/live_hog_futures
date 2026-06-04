"""
易经交叉决策引擎 — 六爻 × 梅花易数 生猪期货价格预测模型
结合古典卦理与现代量化因子，生成实时及1/5/10日期货价格预测走势图
"""

import math
import datetime
from typing import Dict, Any, List, Tuple

# ─────────────────────────────────────────────────────────
# 先天八卦数（邵雍梅花义数取用）
# 乾1 兑2 离3 震4 巽5 坎6 艮7 坤8
# ─────────────────────────────────────────────────────────
BAGUA_NAME = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"]
BAGUA_NUM = [1, 2, 3, 4, 5, 6, 7, 8]

# 八卦五行属性
BAGUA_ELEMENT = {
    "乾": "金",
    "兑": "金",
    "离": "火",
    "震": "木",
    "巽": "木",
    "坎": "水",
    "艮": "土",
    "坤": "土",
}

# 五行与价格趋势映射 (针对生猪期货)
# 金旺 → 收割、下跌压力; 木旺 → 生长、上涨动能;
# 水旺 → 流通顺畅; 火旺 → 消耗旺盛、需求端推升; 土旺 → 稳定整理
ELEMENT_TREND = {
    "金": ("震荡偏空", -1),
    "木": ("震荡偏多", 1),
    "水": ("流通顺畅", 0),
    "火": ("需求旺盛", 1),
    "土": ("整理蓄势", 0),
}

# 六十四卦名（顺序：乾1…坤8 上卦，乾1…坤8 下卦）
GUAS_64 = [
    # 上卦乾(1)
    "乾为天",
    "天泽履",
    "天火同人",
    "天雷无妄",
    "天风姤",
    "天水讼",
    "天山遁",
    "天地否",
    # 上卦兑(2)
    "泽天夬",
    "兑为泽",
    "泽火革",
    "泽雷随",
    "泽风大过",
    "泽水困",
    "泽山咸",
    "泽地萃",
    # 上卦离(3)
    "火天大有",
    "火泽睽",
    "离为火",
    "火雷噬嗑",
    "火风鼎",
    "火水未济",
    "火山旅",
    "火地晋",
    # 上卦震(4)
    "雷天大壮",
    "雷泽归妹",
    "雷火丰",
    "震为雷",
    "雷风恒",
    "雷水解",
    "雷山小过",
    "雷地豫",
    # 上卦巽(5)
    "风天小畜",
    "风泽中孚",
    "风火家人",
    "风雷益",
    "巽为风",
    "风水涣",
    "风山渐",
    "风地观",
    # 上卦坎(6)
    "水天需",
    "水泽节",
    "水火既济",
    "水雷屯",
    "水风井",
    "坎为水",
    "水山蹇",
    "水地比",
    # 上卦艮(7)
    "山天大畜",
    "山泽损",
    "山火贲",
    "山雷颐",
    "山风蛊",
    "山水蒙",
    "艮为山",
    "山地剥",
    # 上卦坤(8)
    "地天泰",
    "地泽临",
    "地火明夷",
    "地雷复",
    "地风升",
    "地水师",
    "地山谦",
    "坤为地",
]

# 六十四卦吉凶倾向 (1=吉/多, -1=凶/空, 0=平)
GUA_BIAS = [
    1,
    -1,
    1,
    -1,
    -1,
    -1,
    -1,
    -1,  # 乾上
    1,
    1,
    -1,
    1,
    -1,
    -1,
    0,
    0,  # 兑上
    1,
    -1,
    0,
    -1,
    1,
    -1,
    -1,
    1,  # 离上
    1,
    -1,
    1,
    0,
    1,
    1,
    -1,
    1,  # 震上
    1,
    1,
    1,
    1,
    0,
    1,
    1,
    1,  # 巽上
    -1,
    0,
    1,
    -1,
    1,
    -1,
    -1,
    0,  # 坎上
    1,
    -1,
    1,
    1,
    -1,
    -1,
    0,
    -1,  # 艮上
    1,
    1,
    -1,
    1,
    1,
    -1,
    1,
    0,  # 坤上
]

# 六爻爻辞吉凶向量（简化版，基于爻位与动爻规律）
# 初爻=潜龙勿用(中性) 二爻=见龙在田(吉) 三爻=夕惕若厉(凶)
# 四爻=或跃在渊(中) 五爻=飞龙在天(大吉) 六爻=亢龙有悔(凶)
YAO_BIAS = [0, 1, -1, 0, 2, -1]  # 初→上


def _get_date_nums(dt: datetime.datetime) -> Tuple[int, int, int, int]:
    """从当前时刻提取年月日时数字"""
    year_last_two = dt.year % 100
    month = dt.month
    day = dt.day
    hour = dt.hour if dt.hour > 0 else 12  # 子时=12
    return year_last_two, month, day, hour


def _num_to_bagua(n: int) -> int:
    """数字取八卦（余数1-8，0→8）"""
    r = n % 8
    return r if r != 0 else 8


def compute_meihua(
    dt: datetime.datetime, spot_price: float, futures_price: float
) -> Dict[str, Any]:
    """
    梅花易数起卦
    ─────────────
    上卦：(年尾数 + 月 + 日) mod 8
    下卦：(年尾数 + 月 + 日 + 时) mod 8
    动爻：(年尾数 + 月 + 日 + 时) mod 6，0→6

    加入价格修正：用现货价与期货价的基差百分比作为扰动因子
    """
    yr, mo, dy, hr = _get_date_nums(dt)

    # 基差扰动（现货折算与期货价差，取整数位）
    basis_factor = int(abs(spot_price * 1000 - futures_price) / 100) % 9

    upper_num = yr + mo + dy + basis_factor
    lower_num = yr + mo + dy + hr + basis_factor
    yao_num = yr + mo + dy + hr

    upper_idx = _num_to_bagua(upper_num) - 1  # 0-indexed
    lower_idx = _num_to_bagua(lower_num) - 1
    dong_yao = yao_num % 6 or 6  # 1-6

    upper_name = BAGUA_NAME[upper_idx]
    lower_name = BAGUA_NAME[lower_idx]

    # 本卦
    ben_gua_idx = upper_idx * 8 + lower_idx
    ben_gua_name = GUAS_64[ben_gua_idx]
    ben_bias = GUA_BIAS[ben_gua_idx]

    # 动爻翻转 → 变卦（动爻所在爻翻转）
    # 简化：动爻属于上卦(4,5,6爻)→变上卦, 下卦(1,2,3爻)→变下卦
    if dong_yao <= 3:
        new_lower_idx = (lower_idx + dong_yao) % 8
        bian_upper_idx = upper_idx
        bian_lower_idx = new_lower_idx
    else:
        new_upper_idx = (upper_idx + (dong_yao - 3)) % 8
        bian_upper_idx = new_upper_idx
        bian_lower_idx = lower_idx

    bian_gua_idx = bian_upper_idx * 8 + bian_lower_idx
    bian_gua_name = GUAS_64[bian_gua_idx]
    bian_bias = GUA_BIAS[bian_gua_idx]

    # 互卦（2,3,4爻→下互; 3,4,5爻→上互）
    hu_lower_idx = (lower_idx + 1) % 8
    hu_upper_idx = (upper_idx + 2) % 8
    hu_gua_idx = hu_upper_idx * 8 + hu_lower_idx
    hu_gua_name = GUAS_64[hu_gua_idx]
    hu_bias = GUA_BIAS[hu_gua_idx]

    # 体卦与用卦判断（动爻在下卦 → 下卦为用卦; 动爻在上卦 → 上卦为用卦）
    if dong_yao <= 3:
        yong_name = lower_name
        ti_name = upper_name
    else:
        yong_name = upper_name
        ti_name = lower_name

    yong_element = BAGUA_ELEMENT[yong_name]
    ti_element = BAGUA_ELEMENT[ti_name]

    # 五行生克逻辑
    # 用生体：卦象对市场有利 → 看多
    # 体克用：力道强劲 → 看多（体强用弱）
    # 用克体：看空
    sheng_ke_score = _wuxing_shengke(yong_element, ti_element)

    # 综合梅花得分 (-3 ~ +3)
    meihua_score = (
        ben_bias * 1.5
        + bian_bias * 0.8
        + hu_bias * 0.5
        + YAO_BIAS[dong_yao - 1]
        + sheng_ke_score
    )

    return {
        "upper": upper_name,
        "lower": lower_name,
        "ben_gua": ben_gua_name,
        "bian_gua": bian_gua_name,
        "hu_gua": hu_gua_name,
        "dong_yao": dong_yao,
        "ti_gua": ti_name,
        "yong_gua": yong_name,
        "ti_element": ti_element,
        "yong_element": yong_element,
        "sheng_ke": sheng_ke_score,
        "score": round(meihua_score, 2),
        "upper_idx": upper_idx,
        "lower_idx": lower_idx,
        "bian_upper_idx": bian_upper_idx,
        "bian_lower_idx": bian_lower_idx,
        "hu_upper_idx": hu_upper_idx,
        "hu_lower_idx": hu_lower_idx,
    }


def _wuxing_shengke(yong: str, ti: str) -> float:
    """五行生克得分，用对体：用生体=+1.5，体生用=+0.5，用克体=-1.5，体克用=+1，比和=0"""
    sheng = {"金": "水", "水": "木", "木": "火", "火": "土", "土": "金"}
    ke = {"金": "木", "木": "土", "土": "水", "水": "火", "火": "金"}
    if sheng.get(yong) == ti:
        return 1.5  # 用生体 大吉
    elif sheng.get(ti) == yong:
        return 0.5  # 体生用 小吉
    elif ke.get(yong) == ti:
        return -1.5  # 用克体 大凶
    elif ke.get(ti) == yong:
        return 1.0  # 体克用 吉（体强）
    return 0.0  # 比和


def compute_liuyao(
    dt: datetime.datetime,
    spot_price: float,
    futures_price: float,
    pig_to_grain: float,
    self_profit: float,
) -> Dict[str, Any]:
    """
    六爻纳甲起卦（京房六爻简化版）
    ──────────────────────────────
    用年月日时分秒的各位数字之和，以及市场量化指标，生成六条爻（老阴/少阴/少阳/老阳）

    爻象: 9=老阳(变阴) 8=少阴(静) 7=少阳(静) 6=老阴(变阳)
    """
    yr, mo, dy, hr = _get_date_nums(dt)
    sec = dt.second + dt.microsecond // 1000000

    # 量化因子归一化
    grain_factor = int(pig_to_grain * 10) % 9
    profit_factor = int(abs(self_profit) / 50) % 9
    price_factor = int(spot_price * 10) % 9

    # 六爻各爻取数
    seeds = [
        yr + mo + dy,
        yr + mo + dy + hr,
        yr + mo + dy + hr + sec,
        yr + mo + dy + hr + sec + grain_factor,
        yr + mo + dy + hr + sec + grain_factor + profit_factor,
        yr + mo + dy + hr + sec + grain_factor + profit_factor + price_factor,
    ]

    yao_vals = []
    for s in seeds:
        r = s % 4
        # 映射到爻象: 0→老阴(6) 1→少阳(7) 2→少阴(8) 3→老阳(9)
        yao_map = {0: 6, 1: 7, 2: 8, 3: 9}
        yao_vals.append(yao_map[r])

    # 本卦（静卦）：9/7→阳爻(—), 6/8→阴爻(- -)
    def yao_to_yin_yang(v):
        return 1 if v in [9, 7] else 0  # 1=阳, 0=阴

    ben_lines = [yao_to_yin_yang(v) for v in yao_vals]  # 初→上

    # 下卦（初爻二爻三爻 bit组成 0-7）
    lower_val = ben_lines[0] * 4 + ben_lines[1] * 2 + ben_lines[2]
    upper_val = ben_lines[3] * 4 + ben_lines[4] * 2 + ben_lines[5]

    # 八卦二进制映射（从下到上 初爻=LSB）
    # 乾=111 兑=110 离=101 震=100 巽=011 坎=010 艮=001 坤=000
    bagua_binary = {
        7: 0,  # 111 → 乾(1)
        6: 1,  # 110 → 兑(2)
        5: 2,  # 101 → 离(3)
        4: 3,  # 100 → 震(4)
        3: 4,  # 011 → 巽(5)
        2: 5,  # 010 → 坎(6)
        1: 6,  # 001 → 艮(7)
        0: 7,  # 000 → 坤(8)
    }

    lower_idx = bagua_binary.get(lower_val, 7)
    upper_idx = bagua_binary.get(upper_val, 0)

    ben_gua_idx = upper_idx * 8 + lower_idx
    ben_gua_name = GUAS_64[ben_gua_idx]
    ben_bias = GUA_BIAS[ben_gua_idx]

    # 动爻（老阴6，老阳9）
    dong_yao_list = [i + 1 for i, v in enumerate(yao_vals) if v in [6, 9]]

    # 变卦（动爻翻转）
    bian_lines = list(ben_lines)
    for idx in dong_yao_list:
        bian_lines[idx - 1] = 1 - bian_lines[idx - 1]

    bian_lower_val = bian_lines[0] * 4 + bian_lines[1] * 2 + bian_lines[2]
    bian_upper_val = bian_lines[3] * 4 + bian_lines[4] * 2 + bian_lines[5]
    bian_lower_idx = bagua_binary.get(bian_lower_val, 7)
    bian_upper_idx = bagua_binary.get(bian_upper_val, 0)
    bian_gua_idx = bian_upper_idx * 8 + bian_lower_idx
    bian_gua_name = GUAS_64[bian_gua_idx]
    bian_bias = GUA_BIAS[bian_gua_idx]

    # 世应爻 (六亲纳甲简化：从宫卦规则确定世爻位数)
    # 简化方案：世爻=动爻最多出现位，或默认五爻(用于期货主力)
    shi_yao = dong_yao_list[0] if dong_yao_list else 5
    ying_yao = 7 - shi_yao if shi_yao != 4 else 1

    # 爻辞得分
    yao_score_total = (
        sum(YAO_BIAS[i] for i in [d - 1 for d in dong_yao_list]) if dong_yao_list else 0
    )

    # 综合六爻得分
    liuyao_score = ben_bias * 2 + bian_bias * 1.2 + yao_score_total

    return {
        "ben_gua": ben_gua_name,
        "bian_gua": bian_gua_name,
        "upper": BAGUA_NAME[upper_idx],
        "lower": BAGUA_NAME[lower_idx],
        "upper_idx": upper_idx,
        "lower_idx": lower_idx,
        "bian_upper_idx": bian_upper_idx,
        "bian_lower_idx": bian_lower_idx,
        "yao_vals": yao_vals,  # 初→上: 6/7/8/9
        "ben_lines": ben_lines,  # 初→上: 0=阴,1=阳
        "dong_yao_list": dong_yao_list,
        "shi_yao": shi_yao,
        "ying_yao": ying_yao,
        "score": round(liuyao_score, 2),
    }


def _score_to_direction(score: float) -> Tuple[str, str, float]:
    """将综合得分映射为方向标签、颜色和置信度"""
    if score > 3.5:
        return "强势看多 ▲▲", "bullish-strong", min(92, 70 + score * 4)
    elif score > 1.5:
        return "震荡偏多 ▲", "bullish", min(80, 60 + score * 5)
    elif score > -1.5:
        return "中性整理 ◆", "neutral", 50 + score * 3
    elif score > -3.5:
        return "震荡偏空 ▼", "bearish", min(80, 60 + abs(score) * 5)
    else:
        return "强势看空 ▼▼", "bearish-strong", min(92, 70 + abs(score) * 4)


def _project_price(
    base_price: float, score: float, days: int, volatility_factor: float = 0.018
) -> Tuple[float, float, float]:
    """
    基于卦象得分和波动率因子推算价格区间
    采用几何布朗运动框架加易学偏置
    """
    drift = score * 0.008 * math.log(1 + days) / math.log(2)
    vol = volatility_factor * math.sqrt(days)
    mu = base_price * (1 + drift)
    upper = base_price * (1 + drift + vol)
    lower = base_price * (1 + drift - vol)
    return round(mu, 2), round(upper, 2), round(lower, 2)


def _gua_to_image_yao(lines: List[int], dong_list: List[int]) -> List[Dict]:
    """将爻线列表转为前端渲染用结构（从上到下显示，逆序）"""
    result = []
    for i in range(5, -1, -1):  # 六爻从上爻到初爻
        pos = i + 1
        result.append(
            {
                "pos": pos,
                "label": ["初", "二", "三", "四", "五", "上"][i],
                "yang": bool(lines[i]),
                "dong": pos in dong_list,
            }
        )
    return result


def generate_yijing_forecast(
    spot_price: float,
    futures_price: float,
    pig_to_grain: float,
    self_profit: float,
    corn_price: float = 2420.0,
) -> Dict[str, Any]:
    """
    综合六爻 + 梅花义数交叉决策，生成实时及1/5/10日价格预测
    """
    now = datetime.datetime.now()
    date_str = now.strftime("%Y-%m-%d %H:%M:%S")

    # 1. 梅花义数
    meihua = compute_meihua(now, spot_price, futures_price)

    # 2. 六爻纳甲
    liuyao = compute_liuyao(now, spot_price, futures_price, pig_to_grain, self_profit)

    # 3. 交叉校验综合得分
    # 梅花权重40% + 六爻权重40% + 量化基本面20%
    quant_score = 0.0
    if pig_to_grain < 5.5:
        quant_score -= 1.5  # 深度亏损 → 偏空（供给出清但当前仍压）
    elif pig_to_grain > 8.0:
        quant_score += 1.0  # 利润丰厚 → 产能扩张信号
    if self_profit < -200:
        quant_score -= 1.0
    elif self_profit > 200:
        quant_score += 1.0
    # 期现基差
    basis = spot_price * 1000 - futures_price
    if basis > 1500:
        quant_score += 0.8  # 现货升水 → 期货回补动能
    elif basis < -500:
        quant_score -= 0.8  # 期货升水 → 现货承压

    total_score = meihua["score"] * 0.40 + liuyao["score"] * 0.40 + quant_score * 0.20

    # 波动率：基于猪粮比异常程度调整
    vol_factor = 0.015 + abs(pig_to_grain - 6.0) * 0.003

    # 4. 时间维度预测
    now_dir, now_cls, now_conf = _score_to_direction(total_score)
    p1_mid, p1_hi, p1_lo = _project_price(spot_price, total_score, 1, vol_factor)
    p5_mid, p5_hi, p5_lo = _project_price(spot_price, total_score, 5, vol_factor)
    p10_mid, p10_hi, p10_lo = _project_price(spot_price, total_score, 10, vol_factor)

    # 5. 古法解盘文字
    meihua_element_trend, _ = ELEMENT_TREND.get(meihua["yong_element"], ("中性", 0))
    yijing_text = _compose_yijing_text(
        meihua, liuyao, now_dir, spot_price, futures_price
    )

    # 6. 爻象渲染数据
    liuyao_yao_render = _gua_to_image_yao(liuyao["ben_lines"], liuyao["dong_yao_list"])

    return {
        "timestamp": date_str,
        "spot_price": spot_price,
        "futures_price": futures_price,
        # 梅花义数结果
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
        # 六爻结果
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
        # 量化因子
        "quant_score": round(quant_score, 2),
        # 综合决策
        "total_score": round(total_score, 2),
        "direction": now_dir,
        "direction_class": now_cls,
        "confidence": round(now_conf, 1),
        # 时间维度价格预测
        "forecast": {
            "realtime": {
                "direction": now_dir,
                "direction_class": now_cls,
                "confidence": round(now_conf, 1),
                "price": spot_price,
            },
            "day1": {
                "mid": p1_mid,
                "high": p1_hi,
                "low": p1_lo,
                "direction": _score_to_direction(total_score * 0.9)[0],
                "direction_class": _score_to_direction(total_score * 0.9)[1],
                "confidence": round(_score_to_direction(total_score * 0.9)[2], 1),
            },
            "day5": {
                "mid": p5_mid,
                "high": p5_hi,
                "low": p5_lo,
                "direction": _score_to_direction(total_score * 0.75)[0],
                "direction_class": _score_to_direction(total_score * 0.75)[1],
                "confidence": round(_score_to_direction(total_score * 0.75)[2], 1),
            },
            "day10": {
                "mid": p10_mid,
                "high": p10_hi,
                "low": p10_lo,
                "direction": _score_to_direction(total_score * 0.6)[0],
                "direction_class": _score_to_direction(total_score * 0.6)[1],
                "confidence": round(_score_to_direction(total_score * 0.6)[2], 1),
            },
        },
        # 解盘文字
        "interpretation": yijing_text,
    }


def _compose_yijing_text(
    meihua: Dict, liuyao: Dict, direction: str, spot: float, futures: float
) -> Dict[str, str]:
    """生成古法解盘文字"""
    sk_map = {
        1.5: "用生体，大吉，主价格受支撑回升",
        0.5: "体生用，小吉，顺势而为",
        -1.5: "用克体，主价格承压下行",
        1.0: "体克用，体强用弱，主稳中有升",
        0.0: "比和，方向不明，静观其变",
    }
    sk_text = sk_map.get(meihua["sheng_ke"], "五行交叉，情势复杂")

    dong_count = len(liuyao["dong_yao_list"])
    dong_text = (
        "卦无动爻，局势凝固，静待变化"
        if dong_count == 0
        else f"共{dong_count}爻发动，{'一爻独发，力道专注' if dong_count == 1 else '多爻联动，局势多变'}"
    )

    basis = round(spot * 1000 - futures)
    basis_desc = (
        "期现基差偏高，现货升水"
        if basis > 1000
        else "期现基差收窄，期货承压" if basis < -500 else "期现处于合理折价区间"
    )

    return {
        "meihua_summary": (
            f"梅花起卦：{meihua['ben_gua']}，变{meihua['bian_gua']}，互{meihua['hu_gua']}。"
            f"体卦为{meihua['ti_gua']}（{meihua['ti_element']}），"
            f"用卦为{meihua['yong_gua']}（{meihua['yong_element']}）。"
            f"{sk_text}。"
        ),
        "liuyao_summary": (
            f"六爻起卦：{liuyao['ben_gua']}，变{liuyao['bian_gua']}。"
            f"{dong_text}。"
            f"世爻居{['初','二','三','四','五','上'][liuyao['shi_yao']-1]}爻，"
            f"应爻居{['初','二','三','四','五','上'][min(liuyao['ying_yao']-1,5)]}爻。"
        ),
        "quant_bridge": (
            f"量化校验：{basis_desc}（基差{basis:+d}元/吨），"
            f"结合卦象综合研判，当前市场{direction}。"
        ),
        "conclusion": (
            f"卦象与量化交叉印证：{direction}，"
            f"短期以{meihua['ben_gua']}象为主，中期关注{meihua['bian_gua']}变化。"
            f"建议结合实际基本面审慎决策，卦理仅供参考。"
        ),
    }
