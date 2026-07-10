import type { SettingsLayoutVariant } from '@proton/components/containers/layout/interface.ts';
import type { IconName } from '@proton/icons/types';

export interface SearchOption {
    id: string;
    value: string;
    icon: IconName | undefined;
    to: string;
    in: string[];
    beta: boolean;
    variant: SettingsLayoutVariant;
}
