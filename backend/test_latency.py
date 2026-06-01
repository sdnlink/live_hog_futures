#!/usr/bin/env python
# -*- coding: utf-8 -*-

import requests
import time
import sys

BASE_URL = "http://localhost:8000"

def test_latency(path, method="GET", params=None, json_data=None):
    url = f"{BASE_URL}{path}"
    start_time = time.perf_counter()
    try:
        if method.upper() == "GET":
            response = requests.get(url, params=params, timeout=180)
        elif method.upper() == "POST":
            response = requests.post(url, json=json_data, params=params, timeout=180)
        else:
            return "INVALID", -1, False
        
        latency_ms = (time.perf_counter() - start_time) * 1000
        is_ok = response.status_code == 200
        return f"{response.status_code}", latency_ms, is_ok
    except Exception as e:
        latency_ms = (time.perf_counter() - start_time) * 1000
        return f"ERROR", latency_ms, False

def main():
    print("==========================================================================================")
    print("                     生猪期货基本面数据监控与决策系统 API 接口延时测试")
    print("==========================================================================================")

    tests = [
        {"name": "实时期货行情", "path": "/api/futures/realtime", "method": "GET"},
        {"name": "期货 LH0 日K线", "path": "/api/futures/kline/LH0", "method": "GET"},
        {"name": "现货基差历史", "path": "/api/spot/basis", "method": "GET"},
        {"name": "批发猪肉价格", "path": "/api/spot/pork", "method": "GET"},
        {"name": "各省猪价排名", "path": "/api/spot/provincial", "method": "GET"},
        {"name": "生猪产能(月)", "path": "/api/fundamentals/capacity", "method": "GET", "params": {"granularity": "monthly"}},
        {"name": "生猪产能(周)", "path": "/api/fundamentals/capacity", "method": "GET", "params": {"granularity": "weekly"}},
        {"name": "生猪产能(日)", "path": "/api/fundamentals/capacity", "method": "GET", "params": {"granularity": "daily"}},
        {"name": "养殖成本与利润", "path": "/api/fundamentals/costs", "method": "GET"},
        {"name": "疫情与舆情指数", "path": "/api/epidemic/status", "method": "GET"},
        {"name": "猪企股票K线", "path": "/api/stocks/trends", "method": "GET"},
        {"name": "猪企实时股票", "path": "/api/stocks/realtime", "method": "GET"},
        {"name": "冷冻猪肉储备", "path": "/api/fundamentals/frozen_pork", "method": "GET"},
        {"name": "生物动保采购", "path": "/api/fundamentals/biopharm", "method": "GET"},
        {"name": "繁育耗材消耗", "path": "/api/fundamentals/consumables", "method": "GET"},
        {"name": "饲料细分销量", "path": "/api/fundamentals/feed_breakdown", "method": "GET"},
        {"name": "物流运能与安全", "path": "/api/fundamentals/logistics_safety", "method": "GET"},
        {"name": "智能专家建议", "path": "/api/expert/advice", "method": "GET", "params": {"symbol": "LH0"}},
        {"name": "六爻梅花预测", "path": "/api/yijing/forecast", "method": "GET", "params": {"symbol": "LH0"}},
        {"name": "手动全数据同步", "path": "/api/sync/all", "method": "POST"},
    ]

    print(f"{'#':<3} | {'接口名称':<16} | {'方法':<4} | {'接口路径':<42} | {'状态':<4} | {'延时 (ms)':<10}")
    print("-" * 106)

    latencies = []
    success_count = 0

    for idx, t in enumerate(tests, 1):
        params = t.get("params")
        json_data = t.get("json_data")
        status, latency, ok = test_latency(t["path"], method=t["method"], params=params, json_data=json_data)
        
        path_display = t["path"]
        if params:
            param_str = "&".join(f"{k}={v}" for k, v in params.items())
            path_display += f"?{param_str}"
            
        status_color = "\033[92m" if ok else "\033[91m"
        reset_color = "\033[0m"
        
        # Format latency display
        latency_str = f"{latency:.2f}"
        if latency > 1000:
            latency_display = f"\033[93m{latency_str}\033[0m" # Yellow if > 1s
        elif latency > 500:
            latency_display = f"\033[94m{latency_str}\033[0m" # Blue if > 500ms
        else:
            latency_display = f"{latency_str}"

        print(f"{idx:<3} | {t['name']:<16} | {t['method']:<4} | {path_display:<42} | {status_color}{status:<4}{reset_color} | {latency_display:<10}")
        
        if ok:
            success_count += 1
            # Skip the sync/all POST request when calculating normal query latency statistics
            if t["path"] != "/api/sync/all":
                latencies.append((t["name"], latency))

    print("-" * 106)
    total_endpoints = len(tests)
    print(f"测试完成: 成功 {success_count}/{total_endpoints}")
    
    if latencies:
        avg_latency = sum(l[1] for l in latencies) / len(latencies)
        max_item = max(latencies, key=lambda x: x[1])
        min_item = min(latencies, key=lambda x: x[1])
        print(f"常规查询接口平均延时 (排除全量同步): {avg_latency:.2f} ms")
        print(f"常规查询接口最大延时: {max_item[1]:.2f} ms ({max_item[0]})")
        print(f"常规查询接口最小延时: {min_item[1]:.2f} ms ({min_item[0]})")

if __name__ == "__main__":
    main()
