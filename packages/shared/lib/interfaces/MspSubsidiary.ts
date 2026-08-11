import type { ORGANIZATION_STATE } from '@proton/shared/lib/constants';

import type { MspDelegatedManager } from '../api/msp';

export interface MspSubsidiary {
    ID: string;
    Name: string;
    Status: ORGANIZATION_STATE; // Only ACTIVE and DISABLED are used for MSP subsidiaries for now
    MaxMembers: number;
    ActiveMembers: number;
    ParentOrgToken: string | undefined;
    DelegatedManagers: MspDelegatedManager[];
}
