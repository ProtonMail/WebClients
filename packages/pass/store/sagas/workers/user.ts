import { api } from '@proton/pass/api/api';
import type { RequiredNonNull } from '@proton/pass/types';
import { PlanType } from '@proton/pass/types';
import { PassFeaturesValues } from '@proton/pass/types/api/features';
import { logger } from '@proton/pass/utils/logger';
import { UNIX_DAY, getEpoch } from '@proton/pass/utils/time';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getLatestID } from '@proton/shared/lib/api/events';
import { getUser } from '@proton/shared/lib/api/user';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { User } from '@proton/shared/lib/interfaces/User';

import type { FeatureFlagsResponse } from '../../../types/api/features';
import type { AddressState, UserFeatureState, UserPlanState, UserState } from '../../reducers';
import { selectUserState } from '../../selectors';
import type { State } from '../../types';

export const getUserFeatures = async (
    { features }: UserState,
    options?: { force: boolean }
): Promise<UserFeatureState> => {
    try {
        if (!options?.force && features && getEpoch() - (features?.requestedAt ?? 0) < UNIX_DAY) return features;

        logger.info(`[Saga::UserFeatures] syncing user feature flags`);
        const { toggles } = await api<FeatureFlagsResponse>({ url: `feature/v2/frontend`, method: 'get' });

        return PassFeaturesValues.reduce<UserFeatureState>(
            (features, feat) => {
                features[feat] = toggles.some((toggle) => toggle.name === feat);
                return features;
            },
            { requestedAt: getEpoch() }
        );
    } catch (_) {
        return features ?? { requestedAt: -1 };
    }
};

export const getUserPlan = async ({ plan }: UserState, options?: { force: boolean }): Promise<UserPlanState> => {
    try {
        const epoch = getEpoch();
        if (!options?.force && plan?.TrialEnd && epoch < plan.TrialEnd) return plan;
        if (!options?.force && plan && epoch - (plan?.requestedAt ?? 0) < UNIX_DAY) return plan;

        logger.info(`[Saga::UserPlan] syncing user access plan`);
        const { Plan } = (await api({ url: 'pass/v1/user/access', method: 'get' })).Access!;
        return { ...Plan, requestedAt: getEpoch() };
    } catch (_) {
        return plan ?? { requestedAt: -1, Type: PlanType.free, InternalName: '', DisplayName: '' };
    }
};

export const getUserData = async (state: State): Promise<RequiredNonNull<UserState>> => {
    const cached = selectUserState(state);

    const [user, addresses, eventId, plan, features] = (await Promise.all([
        /* user model */
        cached.user ?? api<{ User: User }>(getUser()).then(({ User }) => User),

        /* user addresses */
        Object.keys(cached.addresses).length > 0
            ? cached.addresses
            : getAllAddresses(api).then((addresses): AddressState => toMap(addresses, 'ID')),

        /* latest eventId */
        cached.eventId ?? api<{ EventID: string }>(getLatestID()).then(({ EventID }) => EventID),

        /* user plan */
        await getUserPlan(cached),

        /* sync feature flags */
        await getUserFeatures(cached),
    ])) as [User, AddressState, string, UserPlanState, UserFeatureState];

    return { user, plan, addresses, eventId, features };
};
