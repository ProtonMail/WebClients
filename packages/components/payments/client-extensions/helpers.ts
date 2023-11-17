import { PaymentsVersion } from '@proton/shared/lib/api/payments';
import { ChargebeeEnabled, User } from '@proton/shared/lib/interfaces';

export function getMaybeForcePaymentsVersion(user?: User): PaymentsVersion | undefined {
    return user?.ChargebeeUser === ChargebeeEnabled.CHARGEBEE_FORCED ? 'v5' : undefined;
}
