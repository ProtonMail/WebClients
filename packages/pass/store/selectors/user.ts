import type { Maybe } from '@proton/pass/types';
import { PLANS } from '@proton/shared/lib/constants';
import { type Address, UserType } from '@proton/shared/lib/interfaces';

import { State } from '../types';

export const selectUserState = ({ user }: State) => user;

export const selectUser = ({ user: { user } }: State) => user;

export const selectUserTier = ({ user: { tier, user } }: State) =>
    user?.Type === UserType.MANAGED ? 'subuser' : tier ?? PLANS.FREE;

export const selectAllAddresses = ({ user: { addresses } }: State): Address[] => Object.values(addresses);

export const selectAddress =
    (addressId: string) =>
    ({ user: { addresses } }: State): Maybe<Address> =>
        addresses[addressId];

export const selectLatestEventId = ({ user: { eventId } }: State) => eventId;
