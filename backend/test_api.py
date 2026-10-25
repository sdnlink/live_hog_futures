#!/usr/bin/env python
# -*- coding: utf-8 -*-

import requests
import sys

import os

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")


def request_endpoint(path, method="GET", params=None, json_data=None):
    url = f"{BASE_URL}{path}"
    print(f"Testing {method} {url} ... ", end="")
    try:
        if method.upper() == "GET":
            response = requests.get(url, params=params, timeout=15)
        elif method.upper() == "POST":
            response = requests.post(url, json=json_data, params=params, timeout=180)
        else:
            print("INVALID METHOD")
            return None, False

        if response.status_code == 200:
            print("[\033[92mPASS\033[0m]")
            return response.json(), True
        else:
            print(f"[\033[91mFAIL\033[0m] (Status: {response.status_code})")
            print(f"Response: {response.text[:200]}")
            return None, False
    except Exception as e:
        print(f"[\033[91mERROR\033[0m] ({str(e)})")
        return None, False


def main():
    print("==================================================")
    print("  生猪期货基本面数据监控与决策系统 API 接口测试")
    print("==================================================")

    tests = [
        # 1. Real-time futures
        {
            "path": "/api/futures/realtime",
            "method": "GET",
            "validate": lambda data: isinstance(data, list) and len(data) > 0,
        },
        # 2. Futures Kline for LH0
        {
            "path": "/api/futures/kline/LH0",
            "method": "GET",
            "validate": lambda data: isinstance(data, list) and len(data) > 0,
        },
        # 3. Spot prices and basis
        {
            "path": "/api/spot/basis",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 4. Wholesale pork prices
        {
            "path": "/api/spot/pork",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 5. Provincial price rankings
        {
            "path": "/api/spot/provincial",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 6. Swine capacity - Monthly
        {
            "path": "/api/fundamentals/capacity",
            "method": "GET",
            "params": {"granularity": "monthly"},
            "validate": lambda data: isinstance(data, list),
        },
        # 7. Swine capacity - Weekly
        {
            "path": "/api/fundamentals/capacity",
            "method": "GET",
            "params": {"granularity": "weekly"},
            "validate": lambda data: isinstance(data, list),
        },
        # 8. Swine capacity - Daily
        {
            "path": "/api/fundamentals/capacity",
            "method": "GET",
            "params": {"granularity": "daily"},
            "validate": lambda data: isinstance(data, list),
        },
        # 9. Breeding costs and profits
        {
            "path": "/api/fundamentals/costs",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 10. Epidemic and sentiment status
        {
            "path": "/api/epidemic/status",
            "method": "GET",
            "validate": lambda data: isinstance(data, dict)
            and "reports" in data
            and "sentiment" in data,
        },
        # 11. Stock trends
        {
            "path": "/api/stocks/trends",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 12. Realtime stocks
        {
            "path": "/api/stocks/realtime",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 13. Frozen pork storage
        {
            "path": "/api/fundamentals/frozen_pork",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 14. Biopharm procurement
        {
            "path": "/api/fundamentals/biopharm",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 15. Breeding consumables
        {
            "path": "/api/fundamentals/consumables",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 16. Feed sales breakdown
        {
            "path": "/api/fundamentals/feed_breakdown",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 17. Logistics and safety
        {
            "path": "/api/fundamentals/logistics_safety",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 17b. Downstream demand and deep processing
        {
            "path": "/api/fundamentals/downstream_demand",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 17c. Substitute goods prices
        {
            "path": "/api/fundamentals/substitute_prices",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 17d. Pork imports
        {
            "path": "/api/fundamentals/pork_imports",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 17e. Breeding efficiency
        {
            "path": "/api/fundamentals/breeding_efficiency",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 17f. Macro environmental indicators
        {
            "path": "/api/fundamentals/macro_environmental",
            "method": "GET",
            "validate": lambda data: isinstance(data, list),
        },
        # 18. Expert advice
        {
            "path": "/api/expert/advice",
            "method": "GET",
            "params": {"symbol": "LH0"},
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success",
        },
        # 19. Yijing forecast
        {
            "path": "/api/yijing/forecast",
            "method": "GET",
            "params": {"symbol": "LH0"},
            "validate": lambda data: isinstance(data, dict)
            and "direction" in data
            and "meihua" in data,
        },
        # 20. Quantitative price trend forecast
        {
            "path": "/api/forecast/price_trend",
            "method": "GET",
            "params": {"symbol": "LH0"},
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success"
            and "horizons" in data
            and "trajectory_90d" in data,
        },
        # 21. Multi-dimensional analysis report
        {
            "path": "/api/analysis/report",
            "method": "GET",
            "params": {"symbol": "LH0"},
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success"
            and "summary" in data,
        },
        # 22. Futures term structure & calendar spreads
        {
            "path": "/api/futures/term_structure",
            "method": "GET",
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success"
            and "contracts" in data
            and "spreads" in data,
        },
        # 23. Full-factor driver matrix
        {
            "path": "/api/analysis/factors_matrix",
            "method": "GET",
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success"
            and "dimensions" in data
            and len(data["dimensions"]) >= 5,
        },
        # 24. DCE delivery arbitrage calculator
        {
            "path": "/api/arbitrage/delivery_calculator",
            "method": "GET",
            "params": {"contract": "LH2701", "location": "henan", "weight_grade": "standard"},
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success"
            and "breakeven_delivery_cost" in data,
        },
        # 25. Top 20 Member Positions (龙虎榜)
        {
            "path": "/api/futures/broker_positions",
            "method": "GET",
            "params": {"contract": "LH2701"},
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success"
            and "top_short_members" in data
            and "net_lots" in data,
        },
        # 26. Industry Hedging Sandbox Simulation
        {
            "path": "/api/arbitrage/hedging_simulation",
            "method": "GET",
            "params": {"annual_heads": 100000, "hedge_ratio": 0.6},
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success"
            and "scenarios" in data
            and len(data["scenarios"]) == 5,
        },
        # 27. Micro Standard-to-Fat Hog Spreads & Secondary Fattening
        {
            "path": "/api/analysis/micro_spreads",
            "method": "GET",
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success"
            and "spread" in data
            and "fat_standard_ratio" in data,
        },
        # 28. Cull Sow Liquidation & Cycle Turning Point
        {
            "path": "/api/analysis/cull_sow_clearing",
            "method": "GET",
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success"
            and "cull_to_standard_ratio" in data
            and "cycle_bottom_probability_pct" in data,
        },
        # 29. Futures Roll Yield & Delivery Squeeze Risk
        {
            "path": "/api/futures/roll_yield_monitor",
            "method": "GET",
            "params": {"active_contract": "LH2701", "next_contract": "LH2703"},
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success"
            and "annualized_roll_yield_pct" in data
            and "days_to_delivery_month" in data,
        },
        # 30. Global Major Hog Markets & Import Parity
        {
            "path": "/api/global/hog_market",
            "method": "GET",
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success"
            and "us_cme_lean_hog_usd_cents_per_lb" in data
            and "regional_breakdowns" in data
            and len(data["regional_breakdowns"]) >= 3,
        },
        # 31. Supply & Demand Master Summary
        {
            "path": "/api/analysis/supply_demand_summary",
            "method": "GET",
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success"
            and "verdict" in data
            and "pillars" in data
            and len(data["pillars"]) == 4
            and "timeline_6m" in data,
        },
        # 32. Sync all
        {
            "path": "/api/sync/all",
            "method": "POST",
            "validate": lambda data: isinstance(data, dict)
            and data.get("status") == "success",
        },
    ]

    total = len(tests)
    passed = 0
    failed_details = []

    for t in tests:
        params = t.get("params")
        json_data = t.get("json_data")
        data, ok = request_endpoint(
            t["path"], method=t["method"], params=params, json_data=json_data
        )

        if ok:
            # Run validator if exists
            val_fn = t.get("validate")
            if val_fn:
                try:
                    if val_fn(data):
                        passed += 1
                    else:
                        print(
                            "    \033[91mValidation failed for returned data format.\033[0m"
                        )
                        failed_details.append(
                            f"{t['method']} {t['path']} (Validation Failed)"
                        )
                except Exception as ve:
                    print(f"    \033[91mValidation threw error: {ve}\033[0m")
                    failed_details.append(
                        f"{t['method']} {t['path']} (Validation Error: {ve})"
                    )
            else:
                passed += 1
        else:
            failed_details.append(f"{t['method']} {t['path']} (HTTP/Server Error)")

    print("==================================================")
    print(f" 测试完成: 成功 {passed}/{total}，失败 {total - passed}")
    print("==================================================")

    if failed_details:
        print("\n失败的接口详情:")
        for fd in failed_details:
            print(f"- \033[91m{fd}\033[0m")
        sys.exit(1)
    else:
        print("\n\033[92m所有接口测试全部通过！\033[0m")
        sys.exit(0)


if __name__ == "__main__":
    main()
