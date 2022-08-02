import { ThemeColor } from '@proton/colors';
import { IconName } from '../../components';

export interface SubSectionConfig {
    text?: string;
    id: string;
    hide?: boolean;
    available?: boolean;
}

export interface SettingsAreaConfig {
    text: string;
    title?: string;
    description?: string;
    subsections: SubSectionConfig[];
}

export interface SectionConfig extends SettingsAreaConfig {
    to: string;
    icon: IconName;
    available?: boolean;
    notification?: ThemeColor;
}

export interface SidebarConfig {
    readonly available?: boolean;
    readonly header: string;
    readonly routes: { [key: string]: SectionConfig };
}
