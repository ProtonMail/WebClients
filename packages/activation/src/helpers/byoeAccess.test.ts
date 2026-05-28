import { PLANS } from '@proton/payments';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';
import { UserType } from '@proton/shared/lib/interfaces';

import { getCanSeeBYOE } from './byoeAccess';

const adminUser = { Role: USER_ROLES.ADMIN_ROLE, Type: UserType.PROTON } as unknown as UserModel;
const memberUser = { Role: USER_ROLES.MEMBER_ROLE, Type: UserType.PROTON } as unknown as UserModel;
const managedAdminUser = { Role: USER_ROLES.ADMIN_ROLE, Type: UserType.MANAGED } as unknown as UserModel;
const managedMemberUser = { Role: USER_ROLES.MEMBER_ROLE, Type: UserType.MANAGED } as unknown as UserModel;

const b2bOrg = { PlanName: PLANS.BUNDLE_PRO_2024 } as Organization;
const consumerOrg = { PlanName: PLANS.MAIL } as Organization;

describe('getCanSeeBYOE', () => {
    describe('B2B plans', () => {
        it('allows admins', () => {
            expect(getCanSeeBYOE(adminUser, b2bOrg)).toBe(true);
        });

        it('blocks non-admins', () => {
            expect(getCanSeeBYOE(memberUser, b2bOrg)).toBe(false);
        });
    });

    describe('managed users (Visionary/Duo)', () => {
        it('allows managed admins', () => {
            expect(getCanSeeBYOE(managedAdminUser, consumerOrg)).toBe(true);
        });

        it('blocks managed non-admins', () => {
            expect(getCanSeeBYOE(managedMemberUser, consumerOrg)).toBe(false);
        });
    });

    describe('Invited users (Visionary/Duo)', () => {
        it('allows managed admins', () => {
            expect(getCanSeeBYOE(managedAdminUser, consumerOrg)).toBe(true);
        });

        it('blocks managed non-admins', () => {
            expect(getCanSeeBYOE(managedMemberUser, consumerOrg)).toBe(false);
        });
    });

    describe('regular users', () => {
        it('allows users with a consumer plan', () => {
            expect(getCanSeeBYOE(memberUser, consumerOrg)).toBe(true);
        });

        it('allows users with no organization', () => {
            expect(getCanSeeBYOE(memberUser, undefined)).toBe(true);
        });
    });
});
