import type { Logical } from '@proton/shared/lib/vpn/Logical';

export interface EnhancedLogical extends Logical {
    isUpgradeRequired: boolean;
    country: string | undefined;
}
