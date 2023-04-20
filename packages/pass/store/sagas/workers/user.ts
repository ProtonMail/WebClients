import { api } from '@proton/pass/api/api';
import type { RequiredNonNull } from '@proton/pass/types';
import type { UserTier } from '@proton/pass/types/data/telemetry';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getLatestID } from '@proton/shared/lib/api/events';
import { getSubscription } from '@proton/shared/lib/api/payments';
import { getUser } from '@proton/shared/lib/api/user';
import { APPS, PLANS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getPrimaryPlan } from '@proton/shared/lib/helpers/subscription';
import type { Subscription } from '@proton/shared/lib/interfaces/Subscription';
import type { User } from '@proton/shared/lib/interfaces/User';

import type { AddressState, UserState } from '../../reducers';
import { selectUserState } from '../../selectors';
import type { State } from '../../types';

export const getUserData = async (state: State): Promise<RequiredNonNull<UserState>> => {
    const cached = selectUserState(state);

    const [user, addresses, tier, eventId] = (await Promise.all([
        /* user model */
        cached.user ?? api<{ User: User }>(getUser()).then(({ User }) => User),
        /* user addresses */
        Object.keys(cached.addresses).length > 0
            ? cached.addresses
            : getAllAddresses(api).then((addresses): AddressState => toMap(addresses, 'ID')),
        /* user tier */
        cached.tier ??
            api<{ Subscription: Subscription }>(getSubscription())
                .then(({ Subscription }) => getPrimaryPlan(Subscription, APPS.PROTONEXTENSION)?.Name ?? PLANS.FREE)
                .catch(() => PLANS.FREE),
        /* latest eventId */
        cached.eventId ?? api<{ EventID: string }>(getLatestID()).then(({ EventID }) => EventID),
    ])) as [User, AddressState, UserTier, string];

    return { user, addresses, tier, eventId };
};
