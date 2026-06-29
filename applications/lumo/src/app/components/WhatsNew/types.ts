import type { IconName } from '../LumoIcon/LumoIcon';

export interface FeaturePoint {
    icon: IconName;
    getText: () => string;
}

export type WhatsNewStageImageScale = 'sm' | 'md' | 'lg';

export interface WhatsNewStage {
    id: string;
    image?: string;
    imageAlt?: string;
    imageScale?: WhatsNewStageImageScale;
    getTitle: () => string;
    getDescription?: () => string;
    getFeaturePoints?: () => FeaturePoint[];
}

export interface WhatsNewModalFeature {
    lottieAnimation?: () => Promise<{ default: object }>;
    stages: WhatsNewStage[];
}

export type WhatsNewFeature = WhatsNewModalFeature & {
    id: string;
    versionFlag: string;
    settingsPanelToOpen?: string;
    onAction: () => void;
    canShow: boolean;
};
