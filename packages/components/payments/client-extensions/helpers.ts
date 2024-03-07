import { PaymentsVersion } from '@proton/shared/lib/api/payments';
import { ChargebeeEnabled, User } from '@proton/shared/lib/interfaces';

export function getMaybeForcePaymentsVersion(user?: User): PaymentsVersion | undefined {
    return user?.ChargebeeUser === ChargebeeEnabled.CHARGEBEE_FORCED ? 'v5' : undefined;
}

export type ChargebeeEnabledString = 'inhouse-forced' | 'chargebee-allowed' | 'chargebee-forced';

export function chargebeeEnabledToString(chargebeeEnabled: ChargebeeEnabled): ChargebeeEnabledString {
    switch (chargebeeEnabled) {
        case ChargebeeEnabled.INHOUSE_FORCED:
            return 'inhouse-forced';
        case ChargebeeEnabled.CHARGEBEE_ALLOWED:
            return 'chargebee-allowed';
        case ChargebeeEnabled.CHARGEBEE_FORCED:
            return 'chargebee-forced';
    }
}
