import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  FuturesQuote,
  FuturesKline,
  SpotPrice,
  PorkPrice,
  ProvincialPrice,
  SwineCapacity,
  BreedingIndicator,
  EpidemicReport,
  SentimentIndex,
  ExpertAdvice,
  YijingForecast
} from '../types';

const BASE_URL = '/sys1';

export const useAppData = (selectedSymbol: string) => {
  console.log('useAppData hook is running...');
  // Global App States
  const [quotes, setQuotes] = useState<FuturesQuote[]>([]);
  const [klineData, setKlineData] = useState<FuturesKline[]>([]);
  const [spotBasisData, setSpotBasisData] = useState<SpotPrice[]>([]);
  const [porkPriceData, setPorkPriceData] = useState<PorkPrice[]>([]);
  const [provPrices, setProvPrices] = useState<ProvincialPrice[]>([]);
  const [capacityData, setCapacityData] = useState<SwineCapacity[]>([]);
  const [costsData, setCostsData] = useState<BreedingIndicator[]>([]);
  const [epidemicReports, setEpidemicReports] = useState<EpidemicReport[]>([]);
  const [sentimentIndex, setSentimentIndex] = useState<SentimentIndex[]>([]);
  const [expertAdvice, setExpertAdvice] = useState<ExpertAdvice | null>(null);
  const [yijingForecast, setYijingForecast] = useState<YijingForecast | null>(null);

  // Status States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRealtimePolling, setIsRealtimePolling] = useState<boolean>(false);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [isYijingLoading, setIsYijingLoading] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [nextRefreshSec, setNextRefreshSec] = useState<number>(0);

  const selectedSymbolRef = useRef<string>(selectedSymbol);

  useEffect(() => {
    selectedSymbolRef.current = selectedSymbol;
  }, [selectedSymbol]);

  const fetchStaticData = useCallback(async () => {
    try {
      setErrorMsg('');
      const [spotRes, provRes, capRes, costRes, epiRes, porkRes] = await Promise.all([
        fetch(`${BASE_URL}/api/spot/basis`),
        fetch(`${BASE_URL}/api/spot/provincial`),
        fetch(`${BASE_URL}/api/fundamentals/capacity`),
        fetch(`${BASE_URL}/api/fundamentals/costs`),
        fetch(`${BASE_URL}/api/epidemic/status`),
        fetch(`${BASE_URL}/api/spot/pork`),
      ]);

      if (!spotRes.ok || !provRes.ok || !capRes.ok || !costRes.ok || !epiRes.ok || !porkRes.ok) {
        throw new Error('Failed to retrieve macro fundamental data from backend.');
      }

      setSpotBasisData(await spotRes.json());
      setProvPrices(await provRes.json());
      setCapacityData(await capRes.json());
      setCostsData(await costRes.json());
      const epidemicStatus = await epiRes.json();
      setEpidemicReports(epidemicStatus.reports);
      setSentimentIndex(epidemicStatus.sentiment);
      setPorkPriceData(await porkRes.json());
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '网络连接异常，未能获取基本面数据');
    }
  }, []);

  const fetchKline = useCallback(async (symbol: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/futures/kline/${symbol}`);
      if (!res.ok) throw new Error(`Failed to load historical charts for contract ${symbol}`);
      setKlineData(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchRealtimeQuotes = useCallback(async () => {
    try {
      setIsRealtimePolling(true);
      const symbol = selectedSymbolRef.current;
      const [quotesRes, adviceRes] = await Promise.all([
        fetch(`${BASE_URL}/api/futures/realtime`),
        fetch(`${BASE_URL}/api/expert/advice?symbol=${symbol}`),
      ]);

      if (!quotesRes.ok || !adviceRes.ok) throw new Error('Failed to synchronize real-time futures quotes.');

      setQuotes(await quotesRes.json());
      setExpertAdvice(await adviceRes.json());
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRealtimePolling(false);
    }
  }, []);

  const fetchYijingForecast = useCallback(async () => {
    try {
      setIsYijingLoading(true);
      const symbol = selectedSymbolRef.current;
      const res = await fetch(`${BASE_URL}/api/yijing/forecast?symbol=${symbol}`);
      if (!res.ok) throw new Error('易经预测接口请求失败');
      setYijingForecast(await res.json());
    } catch (err) {
      console.error('Yijing forecast error:', err);
    } finally {
      setIsYijingLoading(false);
    }
  }, []);

  const handleManualSync = async () => {
    try {
      setIsManualSyncing(true);
      setErrorMsg('');
      const res = await fetch(`${BASE_URL}/api/sync/all`, { method: 'POST' });
      if (!res.ok) throw new Error('同步请求失败，服务器内部错误');
      await Promise.all([
        fetchStaticData(),
        fetchRealtimeQuotes(),
        fetchKline(selectedSymbolRef.current),
        fetchYijingForecast()
      ]);
      alert('所有基本面数据同步完成！');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '手动同步失败，请检查网络或后端服务');
    } finally {
      setIsManualSyncing(false);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchStaticData(),
        fetchRealtimeQuotes(),
        fetchKline(selectedSymbolRef.current),
        fetchYijingForecast()
      ]);
      setIsLoading(false);
    };
    initApp();

    const TICK_SEC = 10;
    const pickRandomInterval = () => Math.round((Math.floor(Math.random() * (600 - 60 + 1)) + 60) / TICK_SEC) * TICK_SEC;

    let remainingSec = pickRandomInterval();
    setNextRefreshSec(remainingSec);

    const timer = setInterval(() => {
      setNextRefreshSec(prev => {
        const next = prev - TICK_SEC;
        if (next <= 0) {
          setTimeout(() => {
            fetchStaticData();
            fetchRealtimeQuotes();
            fetchKline(selectedSymbolRef.current);
            fetchYijingForecast();
          }, 0);
          const newInterval = pickRandomInterval();
          return newInterval;
        }
        return next;
      });
    }, TICK_SEC * 1000);

    return () => clearInterval(timer);
  }, [fetchStaticData, fetchRealtimeQuotes, fetchKline, fetchYijingForecast]);

  return {
    quotes,
    klineData,
    spotBasisData,
    porkPriceData,
    provPrices,
    capacityData,
    costsData,
    epidemicReports,
    sentimentIndex,
    expertAdvice,
    yijingForecast,
    isLoading,
    isRealtimePolling,
    isManualSyncing,
    isYijingLoading,
    lastSyncTime,
    errorMsg,
    nextRefreshSec,
    fetchKline,
    fetchRealtimeQuotes,
    fetchYijingForecast,
    handleManualSync
  };
};
