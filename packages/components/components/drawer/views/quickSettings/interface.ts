import type { ThemeColor } from '@proton/colors/types';
import type { IconComponent } from '@proton/icons/component';

export interface QuickSettingsReminders {
    icon?: IconComponent;
    color?: ThemeColor;
    text?: string;
    callback: () => void;
    testID: string;
}
