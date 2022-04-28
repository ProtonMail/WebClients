import { ThemeColor } from '@proton/colors';
import * as H from 'history';

import { IconName } from '../../components';

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
    icon: IconName;
    description?: string;
    subsections: SubSectionConfig[];
    available?: boolean;
    notification?: ThemeColor;
}

export interface SidebarConfig {
    readonly available?: boolean;
    readonly header: string;
    readonly routes: { [key: string]: SectionConfig };
}
