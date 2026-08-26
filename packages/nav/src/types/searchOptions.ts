import type { IconComponent, SettingsLayoutVariant } from '@proton/components/containers/layout/interface';

export interface SearchOption {
    id: string;
    value: string;
    icon: IconComponent | undefined;
    to: string;
    in: string[];
    beta: boolean;
    variant: SettingsLayoutVariant;
}
