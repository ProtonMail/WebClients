import type { Feature } from '@proton/features/interface';

export enum NPSApplication {
    WebMail = 'web-mail',
    WebCalendar = 'web-calendar',
    DesktopMail = 'desktop-mail',
    DesktopCalendar = 'desktop-calendar',
}

export interface NetPromoterScoreConfig {
    appName: string;
}

export interface NetPromoterScoreModalProps {
    open: boolean;
    onClose: () => void;
    config: NetPromoterScoreConfig;
    updateFeatureValue: (value: any) => Promise<Feature<any>>;
}
