import * as H from 'history';
import { NotificationDotColor } from '../../components';

export interface SettingsPropsShared {
    location: H.Location;
    config: SectionConfig;
}

export interface SubSectionConfig {
    text?: string;
    id: string;
    hide?: boolean;
    available?: boolean;
}

export interface SectionConfig {
    text: string;
    to: string;
    icon: string;
    description?: string;
    subsections: SubSectionConfig[];
    available?: boolean;
    notification?: NotificationDotColor;
}

export interface SidebarConfig {
    readonly available?: boolean;
    readonly header: string;
    readonly routes: { [key: string]: SectionConfig };
}
