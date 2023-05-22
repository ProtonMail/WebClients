import type { Maybe } from '@proton/pass/types';
import { type Address, UserType } from '@proton/shared/lib/interfaces';

import type { State } from '../types';

export const selectUserState = ({ user }: State) => user;

export const selectUser = ({ user: { user } }: State) => user;

export const selectUserPlan = ({ user: { plan } }: State) => plan;

export const selectUserTier = ({ user: { user, plan } }: State) =>
    user?.Type === UserType.MANAGED ? 'subuser' : plan?.InternalName;

export const selectAllAddresses = ({ user: { addresses } }: State): Address[] => Object.values(addresses);

export const selectAddress =
    (addressId: string) =>
    ({ user: { addresses } }: State): Maybe<Address> =>
        addresses[addressId];

export const selectLatestEventId = ({ user: { eventId } }: State) => eventId;
