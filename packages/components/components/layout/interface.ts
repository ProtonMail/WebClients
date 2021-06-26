import * as H from 'history';
import { PERMISSIONS } from '@proton/shared/lib/constants';

export interface SettingsPropsShared {
    location: H.Location;
    setActiveSection?: (section: string) => void;
}

export interface SubSectionConfig {
    text?: string;
    id: string;
    hide?: boolean;
    permissions?: PERMISSIONS[];
}

export interface SectionConfig {
    text: string;
    to: string;
    icon: string;
    description?: string;
    subsections?: SubSectionConfig[];
    permissions?: PERMISSIONS[];
}
