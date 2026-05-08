import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useLumoSelector } from '../../redux/hooks';
import { Sparkline, type TimePoint } from './Sparkline';
import { SpringMassVisualization } from './SpringMassVisualization';

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
    smoothing?: {
        lag: number;
        bufferSize: number;
        differential: number;
        rate: number;
        drate: number;
        stiffness: number;
        isPulling: boolean;
    } | null;
    history?: {
        tokenDelays: TimePoint[];
        renderTimes: TimePoint[];
        tokensPerSecHistory: TimePoint[];
        fpsHistory: TimePoint[];
        smoothingLag: TimePoint[];
        smoothingRate: TimePoint[];
        smoothingDifferential: TimePoint[];
    };
}

const HISTORY_SIZE = 1000;
const TIME_WINDOW_MS = 30000;

const filterByTimeWindow = (history: TimePoint[], now: number): TimePoint[] => {
    return history.filter((p) => now - p.t <= TIME_WINDOW_MS).slice(-HISTORY_SIZE);
};

const emptyHistory = () => ({
    tokenDelays: [] as TimePoint[],
    renderTimes: [] as TimePoint[],
    tokensPerSecHistory: [] as TimePoint[],
    fpsHistory: [] as TimePoint[],
    smoothingLag: [] as TimePoint[],
    smoothingRate: [] as TimePoint[],
    smoothingDifferential: [] as TimePoint[],
});

interface PerformanceTabProps {
    isVisible: boolean;
}

export const PerformanceTab = ({ isVisible }: PerformanceTabProps) => {
    const messages = useLumoSelector((state) => state.messages || {});
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
        history: emptyHistory(),
    });

    const renderCountRef = useRef(0);
    const lastTokenTimeRef = useRef<number>(Date.now());
    const historyRef = useRef(emptyHistory());
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

        const smoothingMetrics =
            typeof window !== 'undefined' && (window as any).lumoSmoothingDebug
                ? (window as any).lumoSmoothingDebug
                : null;

        historyRef.current = {
            tokenDelays: filterByTimeWindow(
                [...historyRef.current.tokenDelays, { t: now, v: timeSinceLastToken }],
                now
            ),
            renderTimes: filterByTimeWindow([...historyRef.current.renderTimes, { t: now, v: renderTime }], now),
            tokensPerSecHistory: filterByTimeWindow(
                [...historyRef.current.tokensPerSecHistory, { t: now, v: tokensPerSecond }],
                now
            ),
            fpsHistory:
                fps > 0
                    ? filterByTimeWindow([...historyRef.current.fpsHistory, { t: now, v: fps }], now)
                    : filterByTimeWindow(historyRef.current.fpsHistory, now),
            smoothingLag: smoothingMetrics
                ? filterByTimeWindow([...historyRef.current.smoothingLag, { t: now, v: smoothingMetrics.lag }], now)
                : filterByTimeWindow(historyRef.current.smoothingLag, now),
            smoothingRate: smoothingMetrics
                ? filterByTimeWindow([...historyRef.current.smoothingRate, { t: now, v: smoothingMetrics.rate }], now)
                : filterByTimeWindow(historyRef.current.smoothingRate, now),
            smoothingDifferential: smoothingMetrics
                ? filterByTimeWindow(
                      [...historyRef.current.smoothingDifferential, { t: now, v: smoothingMetrics.differential }],
                      now
                  )
                : filterByTimeWindow(historyRef.current.smoothingDifferential, now),
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
            smoothing: smoothingMetrics,
            history: historyRef.current,
        });
    }, [messages, isVisible]);

    const isStreaming = metrics.streamStartTime !== null;

    const handleClearHistory = () => {
        historyRef.current = emptyHistory();
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
        <div className="debug-view-tab-panel">
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

            {metrics.smoothing && (
                <>
                    <div className="debug-view-header" style={{ marginTop: '12px' }}>
                        <span className="debug-view-header-icon">🧮</span>
                        {c('lumo: Debug View').t`Smoothing (Spring-Mass)`}
                    </div>

                    <div className="debug-view-row">
                        <span className="debug-view-label">{c('lumo: Debug View').t`Lag`}</span>
                        <span className="debug-view-value">{metrics.smoothing.lag.toFixed(1)} chars</span>
                    </div>

                    <div className="debug-view-row">
                        <span className="debug-view-label">{c('lumo: Debug View').t`Buffer size`}</span>
                        <span className="debug-view-value">{metrics.smoothing.bufferSize} chars</span>
                    </div>

                    <div className="debug-view-row">
                        <span className="debug-view-label">{c('lumo: Debug View').t`Differential`}</span>
                        <span className="debug-view-value">{metrics.smoothing.differential.toFixed(1)} chars</span>
                    </div>

                    <div className="debug-view-row">
                        <span className="debug-view-label">{c('lumo: Debug View').t`Rate`}</span>
                        <span className="debug-view-value">{metrics.smoothing.rate.toFixed(1)} c/s</span>
                    </div>

                    <div className="debug-view-row">
                        <span className="debug-view-label">{c('lumo: Debug View').t`Acceleration`}</span>
                        <span className="debug-view-value">{metrics.smoothing.drate.toFixed(2)} c/s²</span>
                    </div>

                    <div className="debug-view-row">
                        <span className="debug-view-label">{c('lumo: Debug View').t`Stiffness`}</span>
                        <span className="debug-view-value">{metrics.smoothing.stiffness}</span>
                    </div>

                    <div className="debug-view-row">
                        <span className="debug-view-label">{c('lumo: Debug View').t`Spring state`}</span>
                        <span className="debug-view-value">
                            {metrics.smoothing.isPulling ? '➡️ Pulling' : '⬅️ Pushing'}
                        </span>
                    </div>

                    <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                        <div className="debug-view-chart-label" style={{ marginBottom: '4px' }}>
                            {c('lumo: Debug View').t`Spring-Mass Visualization`}
                        </div>
                        <SpringMassVisualization
                            lag={metrics.smoothing.lag}
                            differential={metrics.smoothing.differential}
                            isPulling={metrics.smoothing.isPulling}
                            rate={metrics.smoothing.rate}
                        />
                    </div>

                    <div className="debug-view-section" style={{ marginTop: '8px' }}>
                        <div className="debug-view-chart">
                            <div className="debug-view-chart-label">{c('lumo: Debug View').t`Lag`} (0-400 chars)</div>
                            <Sparkline
                                data={metrics.history?.smoothingLag || []}
                                width={220}
                                height={30}
                                color="var(--interaction-norm)"
                                minValue={0}
                                maxValue={400}
                                warningThreshold={200}
                                dangerThreshold={300}
                            />
                        </div>

                        <div className="debug-view-chart">
                            <div className="debug-view-chart-label">{c('lumo: Debug View').t`Rate`} (0-400 c/s)</div>
                            <Sparkline
                                data={metrics.history?.smoothingRate || []}
                                width={220}
                                height={30}
                                color="var(--signal-success)"
                                minValue={0}
                                maxValue={400}
                            />
                        </div>

                        <div className="debug-view-chart">
                            <div className="debug-view-chart-label">
                                {c('lumo: Debug View').t`Differential`} (-10-40 chars)
                            </div>
                            <Sparkline
                                data={metrics.history?.smoothingDifferential || []}
                                width={220}
                                height={30}
                                color="var(--signal-warning)"
                                minValue={-10}
                                maxValue={40}
                            />
                        </div>
                    </div>
                </>
            )}

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
            </div>
        </div>
    );
};
