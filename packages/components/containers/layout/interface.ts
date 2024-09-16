import type { ReactNode } from 'react';

import type { ThemeColor } from '@proton/colors';
import { type IconName } from '@proton/components/components/icon/Icon';

export interface SubSectionConfig {
    text?: string;
    id: string;
    hide?: boolean;
    available?: boolean;
    beta?: boolean;
}

export interface SettingsAreaConfig {
    text: string;
    title?: string;
    description?: ReactNode;
    subsections?: SubSectionConfig[];
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
