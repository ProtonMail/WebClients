export interface FeaturePoint {
    icon: React.ReactNode;
    getText: () => string;
}

export interface WhatsNewModalFeature {
    lottieAnimation?: () => Promise<{ default: object }>;
    image?: any;
    getTitle: () => string;
    getDescription?: () => string;
    getFeaturePoints?: () => FeaturePoint[];
}

export type WhatsNewFeature = WhatsNewModalFeature & {
    id: string;
    versionFlag: string;
    settingsPanelToOpen?: string;
    onAction: () => void;
    canShow: boolean;
};
