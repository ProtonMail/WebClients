import type { IconName } from '@proton/icons/types';

export interface Section {
    value: string | (() => string);
    to: string;
    icon?: IconName;
}

interface SearchOption {
    value: string;
    icon?: IconName;
    to: string;
    in: string[];
}

export type SearchOptionsResolved = SearchOption[];
