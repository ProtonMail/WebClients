import type { ReactNode } from 'react';

import type { IconComponent } from '@proton/icons/component';

export interface WalletClient {
    title: string;
    link?: string;
    icon: IconComponent;
    items?: ReactNode[];
}

export enum WalletClientKeys {
    iOS = 0,
    Android = 1,
}
