import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { socket } from '../services/socket';

const CandleChart = ({ data, symbol, timeframe = '1m' }) => {
    const chartContainerRef = useRef();
    const chartRef = useRef();
    const seriesRef = useRef();

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const tfSecondsMap = {
            '1m': 60,
            '5m': 300,
            '10m': 600,
            '15m': 900,
            '30m': 1800,
            '1h': 3600,
            '1d': 86400,
        };
        const resolutionSeconds = tfSecondsMap[timeframe] || 60;

        // Custom theme
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: '#0f172a' }, // Solid slate-900
                textColor: '#94a3b8',
                fontSize: 10,
            },
            grid: {
                vertLines: { color: '#1e293b' },
                horzLines: { color: '#1e293b' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            timeScale: {
                borderColor: '#1e293b',
                timeVisible: true,
                secondsVisible: false,
                barSpacing: 10,
                tickMarkFormatter: (time, tickMarkType, locale) => {
                    const date = new Date(time * 1000);
                    return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
                }
            },
            rightPriceScale: {
                borderColor: '#1e293b',
            },
            localization: {
                locale: 'en-IN',
                priceFormatter: (price) => `₹${price.toFixed(2)}`,
                timeFormatter: (time) => {
                    const date = new Date(time * 1000);
                    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                }
            },
        });

        // V5 API: Use addSeries with CandlestickSeries
        const series = chart.addSeries(CandlestickSeries, {
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        // Format data for lightweight-charts
        // The library expects { time: timestamp/string, open, high, low, close }
        const formattedData = (Array.isArray(data) ? data : []).map(item => ({
            time: Math.floor(new Date(item.createdAt || item.startTime || Date.now()).getTime() / 1000),
            open: item.open || 0,
            high: item.high || 0,
            low: item.low || 0,
            close: item.close || 0,
        })).sort((a, b) => a.time - b.time);

        // Remove duplicates if any (by time)
        const uniqueData = Array.from(new Map(formattedData.map(item => [item.time, item])).values());

        if (uniqueData.length > 0) {
            series.setData(uniqueData);
        }

        chartRef.current = chart;
        seriesRef.current = series;

        // Handle Live Updates
        const handleLiveUpdate = (tick) => {
            if (tick.symbol === symbol) {
                const lastCandle = uniqueData[uniqueData.length - 1];
                const currentTime = Math.floor(new Date().getTime() / (resolutionSeconds * 1000)) * resolutionSeconds;

                const updateData = {
                    time: currentTime,
                    open: lastCandle?.time === currentTime ? lastCandle.open : tick.price,
                    high: lastCandle?.time === currentTime ? Math.max(lastCandle.high, tick.price) : tick.price,
                    low: lastCandle?.time === currentTime ? Math.min(lastCandle.low, tick.price) : tick.price,
                    close: tick.price,
                };

                series.update(updateData);

                // Keep track of the latest locally to ensure OHLC consistency
                if (lastCandle?.time === currentTime) {
                    lastCandle.high = updateData.high;
                    lastCandle.low = updateData.low;
                    lastCandle.close = updateData.close;
                } else {
                    uniqueData.push(updateData);
                }
            }
        };

        socket.on('stockUpdate', handleLiveUpdate);

        // Handle Resize
        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            socket.off('stockUpdate', handleLiveUpdate);
            chart.remove();
        };
    }, [data, symbol, timeframe]);

    return (
        <div className="relative">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{symbol} LIVE FEED</span>
            </div>
            {(Array.isArray(data) ? data : []).length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-20 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 text-sm">Waiting for market ticks...</p>
                    </div>
                </div>
            )}
            <div ref={chartContainerRef} className="w-full rounded-2xl overflow-hidden border border-slate-800" />
        </div>
    );
};

export default CandleChart;
