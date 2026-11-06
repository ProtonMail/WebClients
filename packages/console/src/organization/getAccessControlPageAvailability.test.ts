import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';

import { getAccessControlPageAvailability } from './getAccessControlPageAvailability';

describe('getAccessControlPageAvailability', () => {
    const organizationWithKeys = { Name: 'Org', RequiresKey: 1, HasKeys: 1, UsedMembers: 1 } as OrganizationExtended;

    const getAvailability = ({
        organization = organizationWithKeys,
        hasPermission = true,
        isMultiUser = true,
        isLumoApiEnabled = false,
    }: {
        organization?: OrganizationExtended;
        hasPermission?: boolean;
        isMultiUser?: boolean;
        isLumoApiEnabled?: boolean;
    } = {}) =>
        getAccessControlPageAvailability({
            organization,
            entitlements: { isMultiUser },
            permissions: { 'account.access_control.read': hasPermission },
            isLumoApiEnabled,
        });

    it('shows the page to an organization set up with keys', () => {
        expect(getAvailability().accessControl).toBe(true);
    });

    it('shows the page to an organization set up without keys', () => {
        const organization = { Name: 'Org', RequiresKey: 0, HasKeys: 0, UsedMembers: 1 } as OrganizationExtended;

        expect(getAvailability({ organization }).accessControl).toBe(true);
    });

    it('shows the page to an organization that is not set up but has more than 1 used member', () => {
        const organization = { RequiresKey: 1, HasKeys: 0, UsedMembers: 2 } as OrganizationExtended;

        expect(getAvailability({ organization }).accessControl).toBe(true);
    });

    it('shows the page to a delinquent organization that is set up', () => {
        const organization = { ...organizationWithKeys, State: ORGANIZATION_STATE.DELINQUENT };

        expect(getAvailability({ organization }).accessControl).toBe(true);
    });

    it('hides the page from an organization that is not set up and has a single member', () => {
        const organization = { RequiresKey: 1, HasKeys: 0, UsedMembers: 1 } as OrganizationExtended;

        expect(getAvailability({ organization }).accessControl).toBe(false);
    });

    it('hides the page without an organization', () => {
        expect(
            getAccessControlPageAvailability({
                organization: undefined,
                entitlements: { isMultiUser: true },
                permissions: { 'account.access_control.read': true },
                isLumoApiEnabled: false,
            }).accessControl
        ).toBe(false);
    });

    it('hides the page without the access control read permission', () => {
        expect(getAvailability({ hasPermission: false }).accessControl).toBe(false);
    });

    it.each([
        { isLumoApiEnabled: true, isMultiUser: true, expected: true },
        { isLumoApiEnabled: false, isMultiUser: true, expected: false },
        { isLumoApiEnabled: true, isMultiUser: false, expected: false },
    ])(
        'returns lumoApi $expected with the flag $isLumoApiEnabled and isMultiUser $isMultiUser',
        ({ isLumoApiEnabled, isMultiUser, expected }) => {
            expect(getAvailability({ isLumoApiEnabled, isMultiUser }).lumoApi).toBe(expected);
        }
    );
});
