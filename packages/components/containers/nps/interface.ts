export interface NPSConfig {
    appName: string;
    telemetryApp: string;
}

export interface NPSModalProps {
    show: boolean;
    config: NPSConfig;
}
