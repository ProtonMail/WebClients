import type { ReactNode } from 'react';

import type { ThemeColor } from '@proton/colors';
import type { IconName } from '@proton/icons/types';

export enum SettingsLayoutVariant {
    Default = 'default',
    Card = 'card',
}

export enum SettingsCardMaxWidth {
    Wide = '93.75rem',
    Medium = '68rem',
    Narrow = '46.25rem',
}

export interface SubSectionConfig {
    text?: string;
    invisibleTitle?: boolean;
    id: string;
    hide?: boolean;
    available?: boolean;
    beta?: boolean;
    variant?: SettingsLayoutVariant;
}

export interface SettingsAreaConfig {
    text: string;
    title?: string;
    noTitle?: boolean;
    description?: ReactNode;
    subsections?: SubSectionConfig[];
}

export interface SubrouteConfig {
    id: string;
    text: string;
    to: string;
    icon?: IconName;
    available?: boolean;
    variant?: SettingsLayoutVariant;
}

export interface SubrouteGroup {
    id: string;
    title: string;
    description?: string;
    subroutes: Record<string, SubrouteConfig>;
}

export interface SectionConfig extends SettingsAreaConfig {
    id: string;
    to: string;
    icon: IconName;
    available?: boolean;
    notification?: ThemeColor;
    subroutes?: { [key: string]: SubrouteConfig };
    subrouteGroups?: SubrouteGroup[];
}

export interface SidebarConfig {
    readonly available?: boolean;
    readonly header: string;
    readonly routes: { [key: string]: SectionConfig };
}
