
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, Brush, CartesianGrid, ComposedChart, Bar, ReferenceLine } from 'recharts';
import { getStockNews } from '../services/geminiService';
import { sendNotification } from '../services/notificationService';
import { useApp } from '../context/AppContext';
import { Layers, Activity, TrendingUp, BarChart2, ArrowUpCircle, ArrowDownCircle, Zap, PauseCircle, PlayCircle } from 'lucide-react';

interface StockChartProps {
  ticker: string;
}

// Custom Tooltip Component for Glassmorphic Effect
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 mb-2 border-b border-slate-100 dark:border-white/5 pb-1.5 uppercase tracking-wider flex justify-between">
          <span>Time</span>
          <span className="text-slate-700 dark:text-zinc-300">{label}</span>
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="flex items-center text-slate-600 dark:text-zinc-400 font-semibold mr-4">
                <span className="w-2 h-2 rounded-full mr-2 shadow-sm" style={{ backgroundColor: entry.color }}></span>
                {entry.name === 'value' ? 'Price' : entry.name === 'rsi' ? 'RSI' : entry.name === 'macdHist' ? 'Hist' : entry.name === 'macdLine' ? 'MACD' : entry.name === 'macdSignal' ? 'Signal' : entry.name.toUpperCase()}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-[13px]">
                {entry.name === 'value' ? '₹' : ''}
                {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const StockChart: React.FC<StockChartProps> = ({ ticker }) => {
  const { theme } = useApp();
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M'>('1D');
  const [price, setPrice] = useState(1250.00);
  const [change, setChange] = useState(12.5);
  const [news, setNews] = useState<string[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [isLive, setIsLive] = useState(true);
  
  // Technical Indicators State
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  
  const lastNotifiedPriceRef = useRef(1250.00);

  // Generate initial mock data with time labels
  const initialData = useMemo(() => {
    const data = [];
    let basePrice = 1200 + (ticker.length * 10);
    // Number of data points based on timeframe
    const points = timeframe === '1D' ? 100 : (timeframe === '1W' ? 60 : 120);
    
    let now = new Date();
    // Set start time based on timeframe
    if (timeframe === '1D') {
        now.setHours(9, 15, 0, 0); // Market open 9:15 AM
    } else {
        now.setDate(now.getDate() - points);
    }

    for (let i = 0; i < points; i++) {
      basePrice = basePrice + (Math.random() - 0.45) * 5;
      
      let label = '';
      if (timeframe === '1D') {
          label = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          now.setMinutes(now.getMinutes() + 5); // 5 min candles
      } else {
          label = now.toLocaleDateString([], { day: 'numeric', month: 'short' });
          now.setDate(now.getDate() + 1);
      }

      data.push({
        time: label,
        value: Number(basePrice.toFixed(2))
      });
    }
    return data;
  }, [ticker, timeframe]);

  const [data, setData] = useState(initialData);

  // Update data when timeframe/ticker changes
  useEffect(() => {
    setData(initialData);
    if(initialData.length > 0) {
        setPrice(initialData[initialData.length - 1].value);
    }
  }, [initialData]);

  // Simulate live ticker updates
  useEffect(() => {
    if (timeframe !== '1D' || !isLive) return;

    const interval = setInterval(() => {
      setData(prevData => {
        if (prevData.length === 0) return prevData;
        const lastItem = prevData[prevData.length - 1];
        const lastVal = lastItem.value;
        const volatility = Math.random() > 0.9 ? 5 : 2; 
        const newVal = lastVal + (Math.random() - 0.45) * volatility;
        
        setPrice(newVal);
        const percentChange = ((newVal - 1200) / 1200) * 100;
        setChange(percentChange);

        if (Math.abs(newVal - lastNotifiedPriceRef.current) > 20) {
            sendNotification(
                `Price Alert: ${ticker}`, 
                `${ticker} just moved to ₹${newVal.toFixed(2)} (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%)`
            );
            lastNotifiedPriceRef.current = newVal;
        }

        // Update the last point for live feel without shifting X-axis too fast in this mock
        const newData = [...prevData];
        newData[newData.length - 1] = { ...lastItem, value: Number(newVal.toFixed(2)) };
        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [timeframe, ticker, isLive]);

  useEffect(() => {
    const fetchNews = async () => {
        setLoadingNews(true);
        const headlines = await getStockNews(ticker);
        setNews(headlines);
        setLoadingNews(false);
    };
    fetchNews();
  }, [ticker]);

  // Calculate Indicators
  const chartData = useMemo(() => {
      const periodSMA = 7;
      const periodRSI = 14;

      let prevEma = data.length > 0 ? data[0].value : 0;
      let prevEma12 = data.length > 0 ? data[0].value : 0;
      let prevEma26 = data.length > 0 ? data[0].value : 0;
      let prevEmaSignal = 0;
      
      // RSI Helper vars
      let avgGain = 0;
      let avgLoss = 0;

      return data.map((item, index) => {
          let newItem: any = { ...item };
          const close = item.value;

          // --- SMA ---
          if (index >= periodSMA - 1) {
              const sum = data.slice(index - periodSMA + 1, index + 1).reduce((acc, curr) => acc + curr.value, 0);
              newItem.sma = Number((sum / periodSMA).toFixed(2));
          }

          // --- EMA (Main Chart) ---
          const k = 2 / (periodSMA + 1);
          const ema = (close * k) + (prevEma * (1 - k));
          newItem.ema = Number(ema.toFixed(2));
          prevEma = ema;

          // --- MACD (12, 26, 9) ---
          const k12 = 2 / (12 + 1);
          const ema12 = (close * k12) + (prevEma12 * (1 - k12));
          prevEma12 = ema12;

          const k26 = 2 / (26 + 1);
          const ema26 = (close * k26) + (prevEma26 * (1 - k26));
          prevEma26 = ema26;

          const macdLine = ema12 - ema26;
          newItem.macdLine = macdLine;

          const kSig = 2 / (9 + 1);
          // Initialize signal with macd line first time available
          if (index === 0) prevEmaSignal = macdLine; 
          const signalLine = (macdLine * kSig) + (prevEmaSignal * (1 - kSig));
          prevEmaSignal = signalLine;
          
          newItem.macdSignal = signalLine;
          newItem.macdHist = macdLine - signalLine;

          // --- RSI (14) ---
          if (index > 0) {
              const change = close - data[index-1].value;
              const gain = change > 0 ? change : 0;
              const loss = change < 0 ? Math.abs(change) : 0;

              if (index < periodRSI) {
                  avgGain += gain;
                  avgLoss += loss;
                  newItem.rsi = 50; // Not enough data
              } else {
                  if (index === periodRSI) {
                      avgGain = avgGain / periodRSI;
                      avgLoss = avgLoss / periodRSI;
                  } else {
                      // Wilder's Smoothing
                      avgGain = ((avgGain * 13) + gain) / 14;
                      avgLoss = ((avgLoss * 13) + loss) / 14;
                  }
                  
                  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
                  newItem.rsi = 100 - (100 / (1 + rs));
              }
          } else {
              newItem.rsi = 50;
          }

          return newItem;
      });
  }, [data]);

  const isPositive = change >= 0;
  
  // Dynamic height calculation based on active indicators
  const mainChartHeight = (showRSI || showMACD) ? 200 : 250;

  return (
    <div className="bg-white dark:bg-[#121212] rounded-3xl p-5 my-4 border border-slate-100 dark:border-white/5 transition-all duration-300 shadow-sm relative overflow-hidden group">
      
      {/* Price Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{ticker}</h3>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">₹{price.toFixed(2)}</span>
            <span className={`text-sm font-bold flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <ArrowUpCircle className="w-3.5 h-3.5 mr-1" /> : <ArrowDownCircle className="w-3.5 h-3.5 mr-1" />}
              {change.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Controls - FIX FOR OVERLAPPING */}
      <div className="flex items-center space-x-2 mb-4 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5 mask-fade-sides">
            
            {/* Live Toggle */}
            <button
                onClick={() => { if(navigator.vibrate) navigator.vibrate(5); setIsLive(!isLive); }}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-colors flex items-center shrink-0 whitespace-nowrap ${
                    isLive 
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' 
                    : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-white/5 dark:text-zinc-500 dark:border-white/10'
                }`}
            >
                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                {isLive ? 'LIVE' : 'PAUSED'}
            </button>
            
            <div className="w-px h-6 bg-slate-100 dark:bg-white/10 shrink-0"></div>

            {/* Timeframe Group */}
            <div className="flex bg-slate-100 dark:bg-dark-800 rounded-lg p-1 space-x-1 shrink-0">
            {['1D', '1W', '1M'].map((t) => (
                <button
                key={t}
                onClick={() => { if(navigator.vibrate) navigator.vibrate(5); setTimeframe(t as any); }}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                    timeframe === t 
                    ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-400 dark:text-zinc-500'
                }`}
                >
                {t}
                </button>
            ))}
            </div>
            
            <div className="w-px h-6 bg-slate-100 dark:bg-white/10 shrink-0"></div>

            {/* Indicator Toggles */}
            <button 
                onClick={() => { if(navigator.vibrate) navigator.vibrate(5); setShowSMA(!showSMA); }}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-colors flex items-center shrink-0 whitespace-nowrap ${showSMA ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' : 'bg-transparent text-slate-400 border-slate-200 dark:border-white/10 dark:text-zinc-500'}`}
            >
                <Activity className="w-3 h-3 mr-1" /> SMA
            </button>
            <button 
                onClick={() => { if(navigator.vibrate) navigator.vibrate(5); setShowEMA(!showEMA); }}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-colors flex items-center shrink-0 whitespace-nowrap ${showEMA ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' : 'bg-transparent text-slate-400 border-slate-200 dark:border-white/10 dark:text-zinc-500'}`}
            >
                <Layers className="w-3 h-3 mr-1" /> EMA
            </button>
                <button 
                onClick={() => { if(navigator.vibrate) navigator.vibrate(5); setShowRSI(!showRSI); }}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-colors flex items-center shrink-0 whitespace-nowrap ${showRSI ? 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20' : 'bg-transparent text-slate-400 border-slate-200 dark:border-white/10 dark:text-zinc-500'}`}
            >
                <TrendingUp className="w-3 h-3 mr-1" /> RSI
            </button>
            <button 
                onClick={() => { if(navigator.vibrate) navigator.vibrate(5); setShowMACD(!showMACD); }}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-colors flex items-center shrink-0 whitespace-nowrap ${showMACD ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' : 'bg-transparent text-slate-400 border-slate-200 dark:border-white/10 dark:text-zinc-500'}`}
            >
                <BarChart2 className="w-3 h-3 mr-1" /> MACD
            </button>
      </div>

      <div className="w-full mb-4 relative" style={{ height: mainChartHeight }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={`color${ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                vertical={false} 
                strokeDasharray="3 3" 
                stroke={theme === 'light' ? '#e2e8f0' : '#27272a'} 
                opacity={0.5} 
              />
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: theme === 'light' ? '#cbd5e1' : '#52525b', strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={isPositive ? '#22c55e' : '#ef4444'} 
                fillOpacity={1} 
                fill={`url(#color${ticker})`} 
                strokeWidth={2}
                isAnimationActive={false} 
              />
              {showSMA && (
                  <Line type="monotone" dataKey="sma" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="5 5" isAnimationActive={false} />
              )}
              {showEMA && (
                  <Line type="monotone" dataKey="ema" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
              )}
              {/* Only show brush if no secondary indicators to save space */}
              {!showRSI && !showMACD && (
                 <Brush 
                    dataKey="time" 
                    height={20} 
                    stroke={theme === 'light' ? '#cbd5e1' : '#3f3f46'}
                    fill={theme === 'light' ? '#f8fafc' : '#18181b'}
                    travellerWidth={6}
                    tickFormatter={() => ''}
                    alwaysShowText={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs">
            Loading Chart...
          </div>
        )}
      </div>

      {/* RSI Indicator Chart */}
      {showRSI && (
          <div className="h-24 w-full mb-2 animate-in slide-in-from-top-2 border-t border-slate-100 dark:border-white/5 pt-2">
            <div className="flex justify-between items-center px-1 mb-1">
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">RSI (14)</span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">{chartData.length > 0 ? chartData[chartData.length-1].rsi.toFixed(1) : ''}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <YAxis domain={[0, 100]} hide />
                    <ReferenceLine y={70} stroke="#cbd5e1" strokeDasharray="3 3" />
                    <ReferenceLine y={30} stroke="#cbd5e1" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="rsi" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                    <Tooltip 
                         content={<CustomTooltip />}
                         cursor={{ stroke: theme === 'light' ? '#cbd5e1' : '#52525b', strokeDasharray: '4 4' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
          </div>
      )}

      {/* MACD Indicator Chart */}
      {showMACD && (
          <div className="h-24 w-full mb-2 animate-in slide-in-from-top-2 border-t border-slate-100 dark:border-white/5 pt-2">
            <div className="flex justify-between items-center px-1 mb-1">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">MACD (12, 26, 9)</span>
            </div>
             <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                    <YAxis hide />
                    <Bar dataKey="macdHist" fill="#94a3b8" opacity={0.5} isAnimationActive={false} />
                    <Line type="monotone" dataKey="macdLine" stroke="#6366f1" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="macdSignal" stroke="#f59e0b" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                     <Tooltip 
                         content={<CustomTooltip />}
                         cursor={{ stroke: theme === 'light' ? '#cbd5e1' : '#52525b', strokeDasharray: '4 4' }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
          </div>
      )}
      
      <div className="border-t border-slate-100 dark:border-white/5 pt-3">
        <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase mb-2 flex justify-between tracking-wider">
            <span>News & Impact</span>
            {loadingNews && <span className="animate-pulse text-brand-500">Updating...</span>}
        </h4>
        <ul className="space-y-2">
            {news.length > 0 ? (
                news.map((item, idx) => (
                    <li key={idx} className="text-xs font-medium text-slate-600 dark:text-zinc-400 line-clamp-1 border-l-2 border-brand-300 pl-3">
                        {item}
                    </li>
                ))
            ) : (
                <li className="text-xs text-gray-400 italic">No recent news available.</li>
            )}
        </ul>
      </div>

    </div>
  );
};

export default StockChart;
