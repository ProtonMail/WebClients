import { BillingPlatform, ChargebeeEnabled } from '@proton/shared/lib/interfaces';

import { mockUseSubscription } from './mockUseSubscription';
import { mockUseUser } from './mockUseUser';

export const mockOnSessionMigration = () => {
    mockUseUser([
        {
            ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED,
        },
    ]);

    mockUseSubscription([
        {
            BillingPlatform: BillingPlatform.Proton,
        },
    ]);
};
