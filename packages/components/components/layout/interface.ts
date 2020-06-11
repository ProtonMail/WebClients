import React from 'react';
import * as H from 'history';
import { PERMISSIONS } from 'proton-shared/lib/constants';

export interface SettingsPropsShared {
    location: H.Location;
    setActiveSection: (section: string) => void;
}

export interface SubSectionConfig {
    text: string;
    id: string;
    hide?: boolean;
    permissions?: PERMISSIONS[];
}

export interface SectionConfig {
    node?: React.ReactNode;
    text: string;
    link: string;
    icon: string;
    subsections?: SubSectionConfig[];
    permissions?: PERMISSIONS[];
    // Props to nav item
    [key: string]: any;
}
