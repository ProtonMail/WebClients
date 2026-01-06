import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useLumoSelector } from '../../redux/hooks';
import { SearchIndexDebugModal } from './SettingsModal/SearchIndex/SearchIndexDebugModal';

import './PerformanceMonitor.scss';

interface PerformanceMetrics {
    tokensPerSecond: number;
    totalTokens: number;
    reduxUpdatesPerSecond: number;
    renderCount: number;
    lastUpdateTime: number;
    streamStartTime: number | null;
    streamingTokensGenerated?: number;
    timeSinceLastToken?: number;
    renderTime?: number;
    memoryUsage?: number;
    fps?: number;
    messageCount?: number;
    longestRenderTime?: number;
    history?: {
        tokenDelays: number[];
        renderTimes: number[];
        tokensPerSecHistory: number[];
        fpsHistory: number[];
    };
}

const HISTORY_SIZE = 200;

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    minValue?: number;
    maxValue: number;
    warningThreshold?: number;
    dangerThreshold?: number;
}

const Sparkline = ({
    data,
    width = 100,
    height = 30,
    color = '#00ff00',
    minValue = 0,
    maxValue,
    warningThreshold,
    dangerThreshold,
}: SparklineProps) => {
    if (data.length < 2) return null;

    const range = maxValue - minValue || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const clampedValue = Math.min(Math.max(value, minValue), maxValue);
        const y = height - ((clampedValue - minValue) / range) * height;
        return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;

    const recentValues = data.slice(-10);
    const hasWarning = warningThreshold && recentValues.some((v) => v >= warningThreshold);
    const hasDanger = dangerThreshold && recentValues.some((v) => v >= dangerThreshold);

    const lineColor = hasDanger ? 'var(--signal-danger)' : hasWarning ? 'var(--signal-warning)' : color;

    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            {warningThreshold && (
                <line
                    x1="0"
                    y1={height - ((warningThreshold - minValue) / range) * height}
                    x2={width}
                    y2={height - ((warningThreshold - minValue) / range) * height}
                    stroke="var(--signal-warning)"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                    opacity="0.3"
                />
            )}
            {dangerThreshold && (
                <line
                    x1="0"
                    y1={height - ((dangerThreshold - minValue) / range) * height}
                    x2={width}
                    y2={height - ((dangerThreshold - minValue) / range) * height}
                    stroke="var(--signal-danger)"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                    opacity="0.3"
                />
            )}
            <path d={pathData} fill="none" stroke={lineColor} strokeWidth="1.5" opacity="0.8" />
        </svg>
    );
};

export const PerformanceMonitor = () => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        tokensPerSecond: 0,
        totalTokens: 0,
        reduxUpdatesPerSecond: 0,
        renderCount: 0,
        lastUpdateTime: Date.now(),
        streamStartTime: null,
        memoryUsage: 0,
        fps: 0,
        messageCount: 0,
        longestRenderTime: 0,
        history: {
            tokenDelays: [],
            renderTimes: [],
            tokensPerSecHistory: [],
            fpsHistory: [],
        },
    });
    const [isVisible, setIsVisible] = useState(false);
    const [showSearchIndexDebug, setShowSearchIndexDebug] = useState(false);

    useEffect(() => {
        const checkDebug = () => {
            const enabled = localStorage.getItem('lumo_debug_perf') === 'true';
            setIsVisible(enabled);
        };

        checkDebug();
        window.addEventListener('storage', checkDebug);
        return () => window.removeEventListener('storage', checkDebug);
    }, []);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                const newState = !isVisible;
                setIsVisible(newState);
                localStorage.setItem('lumo_debug_perf', String(newState));
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isVisible]);

    const messages = useLumoSelector((state) => state.messages || {});
    const renderCountRef = useRef(0);
    const lastTokenTimeRef = useRef<number>(Date.now());
    const historyRef = useRef<{
        tokenDelays: number[];
        renderTimes: number[];
        tokensPerSecHistory: number[];
        fpsHistory: number[];
    }>({ tokenDelays: [], renderTimes: [], tokensPerSecHistory: [], fpsHistory: [] });
    const fpsFrameRef = useRef<number>(0);
    const fpsLastTimeRef = useRef<number>(Date.now());
    const longestRenderRef = useRef<number>(0);

    useEffect(() => {
        if (!isVisible) return;

        const renderStartTime = performance.now();
        const now = Date.now();
        const timeSinceLastUpdate = now - metrics.lastUpdateTime;

        renderCountRef.current += 1;

        const totalChars = Object.values(messages).reduce((sum: number, msg: any) => {
            return sum + (msg.content?.length || 0);
        }, 0);

        const totalTokens = Math.round(totalChars / 4);
        const tokenDelta = totalTokens - metrics.totalTokens;

        let timeSinceLastToken = now - lastTokenTimeRef.current;
        if (tokenDelta > 0) {
            lastTokenTimeRef.current = now;
            timeSinceLastToken = 0;
        }

        let streamStartTime = metrics.streamStartTime;
        let streamingTokensGenerated = metrics.streamingTokensGenerated || 0;

        if (tokenDelta > 0 && !streamStartTime) {
            streamStartTime = now;
            streamingTokensGenerated = 0;
            renderCountRef.current = 0;
        } else if (tokenDelta === 0 && streamStartTime && timeSinceLastToken > 5000) {
            streamStartTime = null;
            streamingTokensGenerated = 0;
        }

        if (tokenDelta > 0 && streamStartTime) {
            streamingTokensGenerated += tokenDelta;
        }

        const tokensPerSecond =
            streamStartTime && streamingTokensGenerated > 0
                ? streamingTokensGenerated / ((now - streamStartTime) / 1000)
                : 0;

        const reduxUpdatesPerSecond = timeSinceLastUpdate > 0 ? 1000 / timeSinceLastUpdate : 0;

        const renderEndTime = performance.now();
        const renderTime = renderEndTime - renderStartTime;

        if (renderTime > longestRenderRef.current) {
            longestRenderRef.current = renderTime;
        }

        fpsFrameRef.current++;
        const fpsDelta = now - fpsLastTimeRef.current;
        let fps = 0;
        if (fpsDelta >= 1000) {
            fps = Math.round((fpsFrameRef.current / fpsDelta) * 1000);
            fpsFrameRef.current = 0;
            fpsLastTimeRef.current = now;
        }

        const memoryUsage = (performance as any).memory
            ? Math.round(((performance as any).memory.usedJSHeapSize / 1024 / 1024) * 10) / 10
            : 0;

        const messageCount = Object.keys(messages).length;

        historyRef.current = {
            tokenDelays: [...historyRef.current.tokenDelays, timeSinceLastToken].slice(-HISTORY_SIZE),
            renderTimes: [...historyRef.current.renderTimes, renderTime].slice(-HISTORY_SIZE),
            tokensPerSecHistory: [...historyRef.current.tokensPerSecHistory, tokensPerSecond].slice(-HISTORY_SIZE),
            fpsHistory:
                fps > 0 ? [...historyRef.current.fpsHistory, fps].slice(-HISTORY_SIZE) : historyRef.current.fpsHistory,
        };

        setMetrics({
            tokensPerSecond: Math.round(tokensPerSecond),
            totalTokens,
            reduxUpdatesPerSecond: Math.round(reduxUpdatesPerSecond * 10) / 10,
            renderCount: renderCountRef.current,
            lastUpdateTime: now,
            streamStartTime,
            streamingTokensGenerated,
            timeSinceLastToken,
            renderTime: Math.round(renderTime * 100) / 100,
            memoryUsage,
            fps: fps || metrics.fps,
            messageCount,
            longestRenderTime: Math.round(longestRenderRef.current * 100) / 100,
            history: historyRef.current,
        });
    }, [messages, isVisible]);

    if (!isVisible) return null;

    const isStreaming = metrics.streamStartTime !== null;

    const handleClearHistory = () => {
        historyRef.current = { tokenDelays: [], renderTimes: [], tokensPerSecHistory: [], fpsHistory: [] };
        renderCountRef.current = 0;
        longestRenderRef.current = 0;
        setMetrics((prev) => ({
            ...prev,
            history: historyRef.current,
            renderCount: 0,
            longestRenderTime: 0,
        }));
    };

    const getTokensValueClass = () => {
        if (metrics.tokensPerSecond > 50) return 'debug-view-value--good';
        return 'debug-view-value--muted';
    };

    const getReduxValueClass = () => {
        if (metrics.reduxUpdatesPerSecond >= 100) return 'debug-view-value--danger';
        return '';
    };

    const getFpsValueClass = () => {
        if ((metrics.fps || 0) >= 60) return 'debug-view-value--good';
        return 'debug-view-value--warn';
    };

    const getLastTokenValueClass = () => {
        const value = metrics.timeSinceLastToken || 0;
        if (value < 100) return 'debug-view-value--good';
        if (value < 500) return 'debug-view-value--warn';
        return 'debug-view-value--danger';
    };

    const getRenderTimeValueClass = () => {
        const value = metrics.renderTime || 0;
        if (value < 16) return 'debug-view-value--good';
        if (value < 33) return 'debug-view-value--warn';
        return 'debug-view-value--danger';
    };

    return (
        <div className="debug-view">
            <div className="debug-view-header">
                <span className="debug-view-header-icon">⚡</span>
                {c('lumo: Debug View').t`Debug View`}
            </div>

            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Status`}</span>
                <span className="debug-view-value">
                    {isStreaming ? `🔴 ${c('lumo: Debug View').t`Streaming`}` : `⚪ ${c('lumo: Debug View').t`Idle`}`}
                </span>
            </div>

            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Tokens/sec`}</span>
                <span className={`debug-view-value ${getTokensValueClass()}`}>{metrics.tokensPerSecond}</span>
            </div>

            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Redux/sec`}</span>
                <span className={`debug-view-value ${getReduxValueClass()}`}>{metrics.reduxUpdatesPerSecond}</span>
            </div>

            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Redux updates`}</span>
                <span className="debug-view-value">{metrics.renderCount}</span>
            </div>

            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`FPS`}</span>
                <span className={`debug-view-value ${getFpsValueClass()}`}>{metrics.fps || 0}</span>
            </div>

            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Memory`}</span>
                <span className="debug-view-value">{metrics.memoryUsage}MB</span>
            </div>

            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Messages`}</span>
                <span className="debug-view-value">{metrics.messageCount}</span>
            </div>

            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Last token`}</span>
                <span className={`debug-view-value ${getLastTokenValueClass()}`}>
                    {metrics.timeSinceLastToken || 0}ms
                </span>
            </div>

            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Render time`}</span>
                <span className={`debug-view-value ${getRenderTimeValueClass()}`}>
                    {metrics.renderTime || 0}ms
                    <span className="debug-view-max">
                        ({c('lumo: Debug View').t`max`}: {metrics.longestRenderTime}ms)
                    </span>
                </span>
            </div>

            <div className="debug-view-section">
                <div className="debug-view-chart">
                    <div className="debug-view-chart-label">{c('lumo: Debug View').t`Token delays`} (0-500ms)</div>
                    <Sparkline
                        data={metrics.history?.tokenDelays || []}
                        width={220}
                        height={30}
                        color="var(--interaction-norm)"
                        minValue={0}
                        maxValue={500}
                        warningThreshold={200}
                        dangerThreshold={400}
                    />
                </div>

                <div className="debug-view-chart">
                    <div className="debug-view-chart-label">{c('lumo: Debug View').t`Render time`} (0-50ms)</div>
                    <Sparkline
                        data={metrics.history?.renderTimes || []}
                        width={220}
                        height={30}
                        color="var(--interaction-norm)"
                        minValue={0}
                        maxValue={50}
                        warningThreshold={16}
                        dangerThreshold={33}
                    />
                </div>

                <div className="debug-view-chart">
                    <div className="debug-view-chart-label">{c('lumo: Debug View').t`Tokens/sec`} (0-200)</div>
                    <Sparkline
                        data={metrics.history?.tokensPerSecHistory || []}
                        width={220}
                        height={30}
                        color="var(--signal-success)"
                        minValue={0}
                        maxValue={200}
                    />
                </div>
            </div>

            <div className="debug-view-section debug-view-actions">
                <button className="debug-view-btn debug-view-btn--secondary" onClick={handleClearHistory}>
                    {c('lumo: Debug View').t`Clear History`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--primary"
                    onClick={() => setShowSearchIndexDebug(true)}
                >
                    🔍 {c('lumo: Debug View').t`Search Index Debug`}
                </button>
                <div className="debug-view-hint">
                    <strong>Cmd/Ctrl + Shift + P</strong> {c('lumo: Debug View').t`to toggle`}
                </div>
            </div>

            {showSearchIndexDebug && (
                <SearchIndexDebugModal open={showSearchIndexDebug} onClose={() => setShowSearchIndexDebug(false)} />
            )}
        </div>
    );
};

export default PerformanceMonitor;
