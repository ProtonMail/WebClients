import { api } from '@proton/pass/api/api';
import type { PassPlanResponse, RequiredNonNull } from '@proton/pass/types';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getLatestID } from '@proton/shared/lib/api/events';
import { getUser } from '@proton/shared/lib/api/user';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { User } from '@proton/shared/lib/interfaces/User';

import type { AddressState, UserState } from '../../reducers';
import { selectUserState } from '../../selectors';
import type { State } from '../../types';

export const getUserData = async (state: State): Promise<RequiredNonNull<UserState>> => {
    const cached = selectUserState(state);

    const [user, plan, addresses, eventId] = (await Promise.all([
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
    ])) as [User, PassPlanResponse, AddressState, string];

    return { user, plan, addresses, eventId };
};
