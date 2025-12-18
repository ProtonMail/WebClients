import { useEffect, useState, useRef } from 'react';
import { useLumoSelector } from '../../redux/hooks';
import { SearchIndexDebugModal } from './SettingsModal/SearchIndex/SearchIndexDebugModal';

/**
 * Performance Monitor Component
 *
 * Shows real-time performance metrics for debugging:
 * - Tokens per second during streaming
 * - Redux update frequency
 * - Render count (this component's renders, which reflect Redux updates)
 * - Memory usage estimates
 *
 * Enable with: localStorage.setItem('lumo_debug_perf', 'true')
 */

interface PerformanceMetrics {
    tokensPerSecond: number;
    totalTokens: number;
    reduxUpdatesPerSecond: number;
    renderCount: number;
    lastUpdateTime: number;
    streamStartTime: number | null;
    streamingTokensGenerated?: number;
    timeSinceLastToken?: number; // ms since last token arrived
    renderTime?: number; // time spent rendering (estimate)
    memoryUsage?: number; // MB
    fps?: number; // Frames per second
    messageCount?: number; // Total messages in Redux
    longestRenderTime?: number; // Max render time this session
    history?: {
        tokenDelays: number[]; // Last N token delays
        renderTimes: number[]; // Last N render times
        tokensPerSecHistory: number[]; // Last N tokens/sec readings
        fpsHistory: number[]; // FPS over time
    };
}

const HISTORY_SIZE = 200; // Keep last 200 data points for smoother visualization

/**
 * Mini sparkline chart component with fixed bounds
 */
const Sparkline: React.FC<{
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    minValue?: number;
    maxValue: number; // Now required for stable visualization
    warningThreshold?: number;
    dangerThreshold?: number;
}> = ({ data, width = 100, height = 30, color = '#00ff00', minValue = 0, maxValue, warningThreshold, dangerThreshold }) => {
    if (data.length < 2) return null;

    const range = maxValue - minValue || 1;

    // Create SVG path
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const clampedValue = Math.min(Math.max(value, minValue), maxValue);
        const y = height - ((clampedValue - minValue) / range) * height;
        return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;

    // Check if any recent values exceed thresholds
    const recentValues = data.slice(-10);
    const hasWarning = warningThreshold && recentValues.some(v => v >= warningThreshold);
    const hasDanger = dangerThreshold && recentValues.some(v => v >= dangerThreshold);

    const lineColor = hasDanger ? '#ff0000' : hasWarning ? '#ffaa00' : color;

    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            {/* Reference lines */}
            {warningThreshold && (
                <line
                    x1="0"
                    y1={height - ((warningThreshold - minValue) / range) * height}
                    x2={width}
                    y2={height - ((warningThreshold - minValue) / range) * height}
                    stroke="#ffaa00"
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
                    stroke="#ff0000"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                    opacity="0.3"
                />
            )}
            <path
                d={pathData}
                fill="none"
                stroke={lineColor}
                strokeWidth="1.5"
                opacity="0.8"
            />
        </svg>
    );
};

export const PerformanceMonitor: React.FC = () => {
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

    // Check if debug mode is enabled
    useEffect(() => {
        const checkDebug = () => {
            const enabled = localStorage.getItem('lumo_debug_perf') === 'true';
            setIsVisible(enabled);
        };

        checkDebug();

        // Listen for storage changes
        window.addEventListener('storage', checkDebug);
        return () => window.removeEventListener('storage', checkDebug);
    }, []);

    // Keyboard shortcut: Cmd/Ctrl + Shift + P to toggle
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

    // Monitor Redux state changes (but use a ref to avoid counting our own re-renders)
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

        // Increment external render counter (tracks actual component renders in the app)
        renderCountRef.current += 1;

        // Calculate tokens (approximate: chars / 4 for GPT tokenization)
        const totalChars = Object.values(messages).reduce((sum: number, msg: any) => {
            return sum + (msg.content?.length || 0);
        }, 0);

        // Convert chars to approximate tokens (1 token ≈ 4 chars for English)
        const totalTokens = Math.round(totalChars / 4);

        const tokenDelta = totalTokens - metrics.totalTokens;

        // Track time since last token (to detect backend slowdowns)
        let timeSinceLastToken = now - lastTokenTimeRef.current;
        if (tokenDelta > 0) {
            lastTokenTimeRef.current = now;
            timeSinceLastToken = 0;
        }

        // Start streaming timer if we detect new content
        let streamStartTime = metrics.streamStartTime;
        let streamingTokensGenerated = metrics.streamingTokensGenerated || 0;

        if (tokenDelta > 0 && !streamStartTime) {
            // Just started streaming - reset counters (but keep rolling history)
            streamStartTime = now;
            streamingTokensGenerated = 0;
            renderCountRef.current = 0; // Reset Redux updates counter
            // Don't clear history - let it roll continuously for better visualization
        } else if (tokenDelta === 0 && streamStartTime && timeSinceLastToken > 5000) {
            // Only stop tracking streaming if idle for > 5 seconds (more lenient)
            streamStartTime = null;
            streamingTokensGenerated = 0;
            // Don't reset renderCount - keep it visible even after streaming stops
        }

        // Accumulate tokens generated during this streaming session
        if (tokenDelta > 0 && streamStartTime) {
            streamingTokensGenerated += tokenDelta;
        }

        // Calculate rate: tokens generated THIS session / time elapsed
        const tokensPerSecond = streamStartTime && streamingTokensGenerated > 0
            ? (streamingTokensGenerated / ((now - streamStartTime) / 1000))
            : 0;

        const reduxUpdatesPerSecond = timeSinceLastUpdate > 0
            ? (1000 / timeSinceLastUpdate)
            : 0;

        // Measure render time
        const renderEndTime = performance.now();
        const renderTime = renderEndTime - renderStartTime;

        // Track longest render time
        if (renderTime > longestRenderRef.current) {
            longestRenderRef.current = renderTime;
        }

        // Calculate FPS (frames per second based on Redux updates)
        fpsFrameRef.current++;
        const fpsDelta = now - fpsLastTimeRef.current;
        let fps = 0;
        if (fpsDelta >= 1000) {
            fps = Math.round((fpsFrameRef.current / fpsDelta) * 1000);
            fpsFrameRef.current = 0;
            fpsLastTimeRef.current = now;
        }

        // Get memory usage (if available)
        const memoryUsage = (performance as any).memory
            ? Math.round(((performance as any).memory.usedJSHeapSize / 1024 / 1024) * 10) / 10
            : 0;

        // Count messages
        const messageCount = Object.keys(messages).length;

        // Update history arrays (keep last N entries) using ref to avoid re-render cycles
        historyRef.current = {
            tokenDelays: [...historyRef.current.tokenDelays, timeSinceLastToken].slice(-HISTORY_SIZE),
            renderTimes: [...historyRef.current.renderTimes, renderTime].slice(-HISTORY_SIZE),
            tokensPerSecHistory: [...historyRef.current.tokensPerSecHistory, tokensPerSecond].slice(-HISTORY_SIZE),
            fpsHistory: fps > 0 ? [...historyRef.current.fpsHistory, fps].slice(-HISTORY_SIZE) : historyRef.current.fpsHistory,
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
        setMetrics(prev => ({
            ...prev,
            history: historyRef.current,
            renderCount: 0,
            longestRenderTime: 0,
        }));
    };

    // Clean white theme with purple accents
    const purple = '#6d4aff';
    const bgWhite = '#ffffff';
    const textPrimary = '#1a1a2e';
    const textMuted = '#6b7280';
    const borderColor = '#e5e7eb';
    const goodColor = '#10b981'; // green
    const warnColor = '#f59e0b'; // amber
    const dangerColor = '#ef4444'; // red

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                backgroundColor: bgWhite,
                color: textPrimary,
                padding: '16px 20px',
                borderRadius: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '12px',
                zIndex: 99999,
                minWidth: '260px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                border: `2px solid ${purple}`,
            }}
        >
            <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: purple, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>⚡</span> Performance Monitor
            </div>

            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: textMuted }}>Status</span>
                <span style={{ fontWeight: '500', color: textPrimary }}>
                    {isStreaming ? '🔴 Streaming' : '⚪ Idle'}
                </span>
            </div>

            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: textMuted }}>Tokens/sec</span>
                <span style={{ fontWeight: '500', color: metrics.tokensPerSecond > 50 ? goodColor : textMuted }}>
                    {metrics.tokensPerSecond}
                </span>
            </div>

            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: textMuted }}>Redux/sec</span>
                <span style={{ fontWeight: '500', color: metrics.reduxUpdatesPerSecond < 100 ? textPrimary : dangerColor }}>
                    {metrics.reduxUpdatesPerSecond}
                </span>
            </div>

            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: textMuted }}>Redux updates</span>
                <span style={{ fontWeight: '500', color: textPrimary }}>{metrics.renderCount}</span>
            </div>

            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: textMuted }}>FPS</span>
                <span style={{ fontWeight: '500', color: (metrics.fps || 0) >= 60 ? goodColor : warnColor }}>
                    {metrics.fps || 0}
                </span>
            </div>

            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: textMuted }}>Memory</span>
                <span style={{ fontWeight: '500', color: textPrimary }}>{metrics.memoryUsage}MB</span>
            </div>

            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: textMuted }}>Messages</span>
                <span style={{ fontWeight: '500', color: textPrimary }}>{metrics.messageCount}</span>
            </div>

            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: textMuted }}>Last token</span>
                <span style={{
                    fontWeight: '500',
                    color: (metrics.timeSinceLastToken || 0) < 100 ? goodColor :
                           (metrics.timeSinceLastToken || 0) < 500 ? warnColor : dangerColor
                }}>
                    {metrics.timeSinceLastToken || 0}ms
                </span>
            </div>

            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: textMuted }}>Render time</span>
                <span style={{
                    fontWeight: '500',
                    color: (metrics.renderTime || 0) < 16 ? goodColor :
                           (metrics.renderTime || 0) < 33 ? warnColor : dangerColor
                }}>
                    {metrics.renderTime || 0}ms
                    <span style={{ fontSize: '10px', color: textMuted, marginLeft: '4px' }}>
                        (max: {metrics.longestRenderTime}ms)
                    </span>
                </span>
            </div>

            {/* Sparklines with fixed bounds */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${borderColor}` }}>
                <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '10px', color: textMuted, marginBottom: '4px' }}>
                        Token delays (0-500ms)
                    </div>
                    <Sparkline
                        data={metrics.history?.tokenDelays || []}
                        width={220}
                        height={30}
                        color={purple}
                        minValue={0}
                        maxValue={500}
                        warningThreshold={200}
                        dangerThreshold={400}
                    />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '10px', color: textMuted, marginBottom: '4px' }}>
                        Render time (0-50ms)
                    </div>
                    <Sparkline
                        data={metrics.history?.renderTimes || []}
                        width={220}
                        height={30}
                        color={purple}
                        minValue={0}
                        maxValue={50}
                        warningThreshold={16}
                        dangerThreshold={33}
                    />
                </div>

                <div style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '10px', color: textMuted, marginBottom: '4px' }}>
                        Tokens/sec (0-200)
                    </div>
                    <Sparkline
                        data={metrics.history?.tokensPerSecHistory || []}
                        width={220}
                        height={30}
                        color={goodColor}
                        minValue={0}
                        maxValue={200}
                    />
                </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${borderColor}` }}>
                <button
                    onClick={handleClearHistory}
                    style={{
                        fontSize: '11px',
                        padding: '8px 12px',
                        marginBottom: '8px',
                        backgroundColor: '#f3f4f6',
                        color: textPrimary,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '100%',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                >
                    Clear History
                </button>
                <button
                    onClick={() => setShowSearchIndexDebug(true)}
                    style={{
                        fontSize: '11px',
                        padding: '8px 12px',
                        marginBottom: '10px',
                        backgroundColor: purple,
                        color: bgWhite,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '100%',
                        fontWeight: '500',
                        transition: 'opacity 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                    🔍 Search Index Debug
                </button>
                <div style={{ fontSize: '10px', color: textMuted, lineHeight: '1.5', textAlign: 'center' }}>
                    <div><strong style={{ color: textPrimary }}>Cmd/Ctrl + Shift + P</strong> to toggle</div>
                </div>
            </div>

            {/* Search Index Debug Modal */}
            <SearchIndexDebugModal
                open={showSearchIndexDebug}
                onClose={() => setShowSearchIndexDebug(false)}
            />
        </div>
    );
};

export default PerformanceMonitor;

