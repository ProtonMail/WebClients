import { ChargebeeEnabled, User } from '@proton/shared/lib/interfaces';

export function isScribePaymentsEnabled(user?: User): boolean {
    // users on the legacy subscriptions and who didn't get the feature flag for on-session migration, can't buy the assistant
    return user?.ChargebeeUser !== ChargebeeEnabled.INHOUSE_FORCED;
}
