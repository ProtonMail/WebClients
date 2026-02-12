import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { generateSpaceKeyBase64 } from '../../crypto';
import { LAG0 } from '../../lib/lumo-api-client/core/transforms/smoothing';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { addConversation } from '../../redux/slices/core/conversations';
import {addSpace, newSpaceId } from '../../redux/slices/core/spaces';
import type { Conversation, Space } from '../../types';
import { ConversationStatus } from '../../types';
import { SearchIndexDebugModal } from './SettingsModal/SearchIndex/SearchIndexDebugModal';
import { TestRendererModal } from './TestRendererModal';

import './PerformanceMonitor.scss';

interface TimePoint {
    t: number;
    v: number;
}

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
const TIME_WINDOW_MS = 30000; // 30 seconds

// Helper to filter time-based history to last 30s
const filterByTimeWindow = (history: TimePoint[], now: number): TimePoint[] => {
    return history.filter((p) => now - p.t <= TIME_WINDOW_MS).slice(-HISTORY_SIZE);
};

interface SparklineProps {
    data: TimePoint[];
    width?: number;
    height?: number;
    color?: string;
    minValue?: number;
    maxValue: number;
    warningThreshold?: number;
    dangerThreshold?: number;
}

interface SpringMassVisualizationProps {
    lag: number;
    differential: number;
    isPulling: boolean;
    rate: number;
}

const SpringMassVisualization = ({ lag, isPulling, rate }: SpringMassVisualizationProps) => {
    const width = 220;
    const height = 80;
    const restPosition = LAG0; // lag0
    const maxLag = 400;

    // Calculate positions (inverted: wall on right, mass moves left as lag increases)
    // massX represents the RIGHT edge of the mass
    const massSize = 20;
    const massX = width - massSize - (lag / maxLag) * (width - 60);
    const springStartX = massX; // Spring connects to right edge of mass
    const springEndX = width - massSize;

    // Spring parameters
    const springCoils = 8;
    const springAmplitude = 8;
    const springColor = isPulling ? 'var(--signal-danger)' : 'var(--signal-success)';
    const restX = width - 20 - (restPosition / maxLag) * (width - 60);

    // Generate spring path
    const springPath = [];
    const springLength = springEndX - springStartX;
    const segmentLength = springLength / (springCoils * 2);

    springPath.push(`M ${springStartX} ${height / 2}`);
    for (let i = 0; i < springCoils; i++) {
        const x1 = springStartX + (i * 2 + 1) * segmentLength;
        const x2 = springStartX + (i * 2 + 2) * segmentLength;
        springPath.push(`L ${x1} ${height / 2 - springAmplitude}`);
        springPath.push(`L ${x2} ${height / 2 + springAmplitude}`);
    }
    springPath.push(`L ${springEndX} ${height / 2}`);

    const massOpacity = Math.min(0.4 + (rate / 100) * 0.6, 1);

    return (
        <svg width={width} height={height} style={{ display: 'block', background: 'var(--background-weak)' }}>
            {/* Rest position indicator */}
            <line
                x1={restX}
                y1={10}
                x2={restX}
                y2={height - 10}
                stroke="var(--text-weak)"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.4"
            />
            <text x={restX} y={8} fontSize="8" fill="var(--text-weak)" textAnchor="middle">
                rest
            </text>

            {/* Wall/anchor */}
            <rect x={width - 20} y={height / 2 - 15} width={5} height={30} fill="var(--text-norm)" opacity="0.6" />

            {/* Spring */}
            <path d={springPath.join(' ')} fill="none" stroke={springColor} strokeWidth="2" opacity="0.8" />

            {/* Mass - positioned with right edge at massX */}
            <rect
                x={massX - massSize}
                y={height / 2 - massSize / 2}
                width={massSize}
                height={massSize}
                fill={springColor}
                opacity={massOpacity}
                stroke="var(--text-norm)"
                strokeWidth="1.5"
            />

            {/* Direction arrow - above the mass */}
            {rate > 1 && (
                <path
                    d={
                        isPulling
                            ? `M ${massX} ${height / 2 - massSize / 2 - 5} L ${massX + 10} ${height / 2 - massSize / 2 - 5} L ${massX + 7} ${height / 2 - massSize / 2 - 8} M ${massX + 10} ${height / 2 - massSize / 2 - 5} L ${massX + 7} ${height / 2 - massSize / 2 - 2}`
                            : `M ${massX - massSize} ${height / 2 - massSize / 2 - 5} L ${massX - massSize - 10} ${height / 2 - massSize / 2 - 5} L ${massX - massSize - 7} ${height / 2 - massSize / 2 - 8} M ${massX - massSize - 10} ${height / 2 - massSize / 2 - 5} L ${massX - massSize - 7} ${height / 2 - massSize / 2 - 2}`
                    }
                    stroke={springColor}
                    strokeWidth="2"
                    fill="none"
                />
            )}

            {/* Labels */}
            <text x={10} y={height - 5} fontSize="9" fill="var(--text-weak)">
                {maxLag}
            </text>
            <text x={width - 25} y={height - 5} fontSize="9" fill="var(--text-weak)">
                0
            </text>
        </svg>
    );
};

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

    // Time-based x-positioning
    const oldestTime = data[0].t;
    const newestTime = data[data.length - 1].t;
    const timeWindow = newestTime - oldestTime || 1; // avoid div by 0

    const points = data.map((point) => {
        const x = ((point.t - oldestTime) / timeWindow) * width;
        const clampedValue = Math.min(Math.max(point.v, minValue), maxValue);
        const y = height - ((clampedValue - minValue) / range) * height;
        return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;

    const recentValues = data.slice(-10);
    const hasWarning = warningThreshold && recentValues.some((p) => p.v >= warningThreshold);
    const hasDanger = dangerThreshold && recentValues.some((p) => p.v >= dangerThreshold);

    // eslint-disable-next-line no-nested-ternary
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

const PerformanceMonitor = () => {
    const dispatch = useLumoDispatch();
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
            smoothingLag: [],
            smoothingRate: [],
            smoothingDifferential: [],
        },
    });
    const [isVisible, setIsVisible] = useState(false);
    const [showSearchIndexDebug, setShowSearchIndexDebug] = useState(false);
    const [showTestRenderer, setShowTestRenderer] = useState(false);

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
        tokenDelays: TimePoint[];
        renderTimes: TimePoint[];
        tokensPerSecHistory: TimePoint[];
        fpsHistory: TimePoint[];
        smoothingLag: TimePoint[];
        smoothingRate: TimePoint[];
        smoothingDifferential: TimePoint[];
    }>({
        tokenDelays: [],
        renderTimes: [],
        tokensPerSecHistory: [],
        fpsHistory: [],
        smoothingLag: [],
        smoothingRate: [],
        smoothingDifferential: [],
    });
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

        // Read smoothing metrics from window
        const smoothingMetrics =
            typeof window !== 'undefined' && (window as any).lumoSmoothingDebug
                ? (window as any).lumoSmoothingDebug
                : null;

        // Update history with time-stamped points, filter by 30s window
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

    if (!isVisible) return null;

    const isStreaming = metrics.streamStartTime !== null;

    const handleClearHistory = () => {
        historyRef.current = {
            tokenDelays: [],
            renderTimes: [],
            tokensPerSecHistory: [],
            fpsHistory: [],
            smoothingLag: [],
            smoothingRate: [],
            smoothingDifferential: [],
        };
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

    const handleCreateTestChats = () => {
        const now = new Date();
        const testSpaceId = newSpaceId();
        const spaceKey = generateSpaceKeyBase64();

        // Create a test space
        const testSpace: Space = {
            id: testSpaceId,
            createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            spaceKey,
            isProject: true,
            projectName: 'Test Space (Expiring Chats)',
            projectIcon: 'test',
        };

        dispatch(addSpace(testSpace));

        // Create test conversations with different ages
        const testConversations: Conversation[] = [
            // Today
            {
                id: newSpaceId(),
                spaceId: testSpaceId,
                title: 'Recent conversation about React hooks',
                createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
                starred: false,
                status: ConversationStatus.COMPLETED,
            },
            // 3 days old - safe
            {
                id: newSpaceId(),
                spaceId: testSpaceId,
                title: 'Help with TypeScript generics',
                createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                starred: false,
                status: ConversationStatus.COMPLETED,
            },
            // 5 days old - expires in 2 days
            {
                id: newSpaceId(),
                spaceId: testSpaceId,
                title: 'Database optimization strategies',
                createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                starred: false,
                status: ConversationStatus.COMPLETED,
            },
            // 6 days old - expires tomorrow
            {
                id: newSpaceId(),
                spaceId: testSpaceId,
                title: 'API design best practices',
                createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                starred: false,
                status: ConversationStatus.COMPLETED,
            },
            // 6.9 days old - expires today
            {
                id: newSpaceId(),
                spaceId: testSpaceId,
                title: 'CSS Grid vs Flexbox comparison',
                createdAt: new Date(now.getTime() - 6.9 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now.getTime() - 6.9 * 24 * 60 * 60 * 1000).toISOString(),
                starred: false,
                status: ConversationStatus.COMPLETED,
            },
            // 8 days old - already expired for free users
            {
                id: newSpaceId(),
                spaceId: testSpaceId,
                title: 'Docker container networking',
                createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                starred: false,
                status: ConversationStatus.COMPLETED,
            },
        ];

        testConversations.forEach((conv) => {
            dispatch(addConversation(conv));
        });

        // eslint-disable-next-line no-alert
        alert(`Created ${testConversations.length} test conversations!\n\nCheck the sidebar to see:\n- Today section (1 chat)\n- Last 7 days (1 chat)\n- Expiring Soon (3 chats) ⚠️\n- Last 30 days (1 chat - hidden for free users)`);
    };

    const handleTestRenderer = () => {
        setShowTestRenderer(true);
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
                <button
                    className="debug-view-btn debug-view-btn--primary"
                    onClick={() => setShowSearchIndexDebug(true)}
                >
                    🔍 {c('lumo: Debug View').t`Search Index Debug`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--primary"
                    onClick={handleTestRenderer}
                    style={{ background: 'var(--interaction-norm)' }}
                >
                    🧪 {c('lumo: Debug View').t`Test Renderer`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--primary"
                    onClick={handleCreateTestChats}
                    style={{ background: 'var(--signal-warning)' }}
                >
                    ⚠️ {c('lumo: Debug View').t`Create Test Chats`}
                </button>
                <div className="debug-view-hint">
                    <strong>Cmd/Ctrl + Shift + P</strong> {c('lumo: Debug View').t`to toggle`}
                </div>
            </div>

            {showSearchIndexDebug && (
                <SearchIndexDebugModal open={showSearchIndexDebug} onClose={() => setShowSearchIndexDebug(false)} />
            )}
            {showTestRenderer && (
                <TestRendererModal open={showTestRenderer} onClose={() => setShowTestRenderer(false)} />
            )}
        </div>
    );
};

export default PerformanceMonitor;
