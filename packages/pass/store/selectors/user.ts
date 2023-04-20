import { PLANS } from '@proton/shared/lib/constants';
import { UserType } from '@proton/shared/lib/interfaces';

import { State } from '../types';

export const selectUserState = ({ user }: State) => user;

export const selectUser = ({ user: { user } }: State) => user;

export const selectUserTier = ({ user: { tier, user } }: State) =>
    user?.Type === UserType.MANAGED ? 'subuser' : tier ?? PLANS.FREE;

export const selectAllAddresses = ({ user: { addresses } }: State) => Object.values(addresses);

export const selectAddress =
    (addressId: string) =>
    ({ user: { addresses } }: State) =>
        addresses[addressId];

export const selectLatestEventId = ({ user: { eventId } }: State) => eventId;
