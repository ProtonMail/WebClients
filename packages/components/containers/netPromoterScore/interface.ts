export interface NetPromoterScoreConfig {
    appName: string;
    telemetryApp: string;
}

export interface NetPromoterScoreModalProps {
    show: boolean;
    config: NetPromoterScoreConfig;
}
