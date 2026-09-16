/**
 * Desktop inbox heartbeat metric payload (mirrors @proton/metrics schema without importing it).
 */
export interface DesktopInboxHeartbeatMetricPayload {
    Labels: {
        releaseCategory: 'Stable' | 'EarlyAccess' | 'Alpha';
        hadFailToLoadView: 'true' | 'false';
        hadNetworkError: 'true' | 'false';
        hadMainError: 'true' | 'false';
        hadUpdateError: 'true' | 'false';
    };
    Value: number;
}
