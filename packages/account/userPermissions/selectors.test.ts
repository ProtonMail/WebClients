import type { UserModel } from '@proton/shared/lib/interfaces';
import { PERMISSIONS } from '@proton/shared/lib/interfaces/UserPermission';

import { getModelState } from '../test';
import { selectOrgPermissions, selectOrgPermissionsLegacy } from './index';
import type { UserPermissionsState } from './index';

const makeState = ({
    user,
    permissions,
}: {
    user?: Partial<UserModel>;
    permissions?: string[];
} = {}): UserPermissionsState =>
    ({
        user: getModelState(user !== undefined ? ({ isAdmin: false, isSelf: true, ...user } as UserModel) : undefined),
        userPermissions: getModelState(permissions !== undefined ? { Roles: [], Permissions: permissions } : undefined),
    }) as UserPermissionsState;

describe('selectOrgPermissions', () => {
    it('returns loading when user is not yet available', () => {
        const state = makeState({ permissions: [] });
        expect(selectOrgPermissions(state)).toEqual([null, true]);
    });

    it('returns loading when userPermissions is not yet available', () => {
        const state = makeState({ user: {} });
        expect(selectOrgPermissions(state)).toEqual([null, true]);
    });

    it('grants all permissions to a legacy admin (isAdmin && isSelf)', () => {
        const state = makeState({ user: { isAdmin: true, isSelf: true }, permissions: [] });
        const [record, loading] = selectOrgPermissions(state);
        expect(loading).toBe(false);
        PERMISSIONS.forEach((p) => expect(record![p]).toBe(true));
    });

    it('grants only assigned permissions to a regular user', () => {
        const granted = 'account.user.read';
        const state = makeState({ user: { isAdmin: false }, permissions: [granted] });
        const [record, loading] = selectOrgPermissions(state);
        expect(loading).toBe(false);
        expect(record![granted]).toBe(true);
        PERMISSIONS.filter((p) => p !== granted).forEach((p) => expect(record![p]).toBe(false));
    });

    it('denies all permissions when user has no roles and is not a legacy admin', () => {
        const state = makeState({ user: { isAdmin: false }, permissions: [] });
        const [record, loading] = selectOrgPermissions(state);
        expect(loading).toBe(false);
        PERMISSIONS.forEach((p) => expect(record![p]).toBe(false));
    });

    it('does not grant all permissions when admin is impersonating (isAdmin && !isSelf)', () => {
        const granted = 'account.user.read';
        const state = makeState({ user: { isAdmin: true, isSelf: false }, permissions: [granted] });
        const [record] = selectOrgPermissions(state);
        expect(record![granted]).toBe(true);
        expect(record!['account.user.create']).toBe(false);
    });
});

describe('selectOrgPermissionsLegacy', () => {
    it('returns loading when user is not yet available', () => {
        expect(selectOrgPermissionsLegacy(makeState())).toEqual([null, true]);
    });

    it('grants all permissions to a legacy admin (isAdmin && isSelf)', () => {
        const state = makeState({ user: { isAdmin: true, isSelf: true } });
        const [record, loading] = selectOrgPermissionsLegacy(state);
        expect(loading).toBe(false);
        PERMISSIONS.forEach((p) => expect(record![p]).toBe(true));
    });

    it('denies all permissions to a non-admin user', () => {
        const state = makeState({ user: { isAdmin: false } });
        const [record, loading] = selectOrgPermissionsLegacy(state);
        expect(loading).toBe(false);
        PERMISSIONS.forEach((p) => expect(record![p]).toBe(false));
    });

    it('denies all permissions when admin is impersonating (isAdmin && !isSelf)', () => {
        const state = makeState({ user: { isAdmin: true, isSelf: false } });
        const [record] = selectOrgPermissionsLegacy(state);
        PERMISSIONS.forEach((p) => expect(record![p]).toBe(false));
    });
});
