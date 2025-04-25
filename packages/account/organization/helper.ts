import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { type User, UserLockedFlags } from '@proton/shared/lib/interfaces';
import { isPaid } from '@proton/shared/lib/user/helpers';

const getIsOrgAdminUserInLockedState = (user: User) =>
    /*
    After auto-downgrade admin user is downgraded to a free user, organization state is set to `Delinquent`
    and the user gets into a locked state if they have members in their organizaion and .
    In that case we want to refetch the organization to avoid getting FREE_ORGANIZATION object.
    */
    hasBit(user.LockedFlags, UserLockedFlags.ORG_ISSUE_FOR_PRIMARY_ADMIN);

export const canFetchOrganization = (user: User) => {
    return isPaid(user) || getIsOrgAdminUserInLockedState(user);
};
