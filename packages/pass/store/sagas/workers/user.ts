import type { Feature } from '@proton/components/containers/features';
import { api } from '@proton/pass/api/api';
import type { PassPlanResponse, RequiredNonNull } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';
import { PassFeaturesValues } from '@proton/pass/types/api/features';
import { logger } from '@proton/pass/utils/logger';
import { UNIX_DAY, getEpoch } from '@proton/pass/utils/time';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getLatestID } from '@proton/shared/lib/api/events';
import { getFeatures } from '@proton/shared/lib/api/features';
import { getUser } from '@proton/shared/lib/api/user';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { User } from '@proton/shared/lib/interfaces/User';

import type { AddressState, UserFeatureState, UserState } from '../../reducers';
import { selectUserState } from '../../selectors';
import type { State } from '../../types';

export const getUserFeatures = async ({ features }: UserState): Promise<UserFeatureState> => {
    try {
        if (features && getEpoch() - (features?.requestedAt ?? 0) < UNIX_DAY) return features;

        logger.info(`[Saga::UserFeatures] syncing user feature flags`);
        const { Features } = await api<{ Features: Feature[] }>(getFeatures(PassFeaturesValues));

        return Features.reduce<UserFeatureState>(
            (features, feature) => {
                features[feature.Code as PassFeature] = feature;
                return features;
            },
            { requestedAt: getEpoch() }
        );
    } catch (_) {
        return features ?? { requestedAt: -1 };
    }
};

export const getUserData = async (state: State): Promise<RequiredNonNull<UserState>> => {
    const cached = selectUserState(state);

    const [user, plan, addresses, eventId, features] = (await Promise.all([
        /* user model */
        cached.user ?? api<{ User: User }>(getUser()).then(({ User }) => User),

        /* user plan */
        cached.plan ?? api({ url: 'pass/v1/user/access', method: 'post' }).then(({ Access }) => Access?.Plan),

        /* user addresses */
        Object.keys(cached.addresses).length > 0
            ? cached.addresses
            : getAllAddresses(api).then((addresses): AddressState => toMap(addresses, 'ID')),

        /* latest eventId */
        cached.eventId ?? api<{ EventID: string }>(getLatestID()).then(({ EventID }) => EventID),

        /* sync feature flags */
        await getUserFeatures(cached),
    ])) as [User, PassPlanResponse, AddressState, string, UserFeatureState];

    return { user, plan, addresses, eventId, features };
};
