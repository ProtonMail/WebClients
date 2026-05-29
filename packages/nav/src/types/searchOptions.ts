import type { IconName } from '@proton/icons/types';

export const enum SettingsLayoutVariant {
    Default = 'default',
    Card = 'card',
}

export interface SearchOption {
    id: string;
    value: string;
    icon: IconName | undefined;
    to: string;
    in: string[];
    beta: boolean;
    variant: SettingsLayoutVariant;
}
