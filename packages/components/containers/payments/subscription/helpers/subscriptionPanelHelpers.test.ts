import { getManageUserPermissionsAndAccessFeature } from '../../features/b2b';
import { getUsersFeature } from '../../features/highlights';
import { getContactGroupsManagement } from '../../features/mail';
import { getMaxParticipants } from '../../features/meet';
import type { Upsell } from './dashboard-upsells';
import { upsellsShowB2BUsersRow } from './subscriptionPanelHelpers';

const buildUpsell = (features: Upsell['features']): Upsell => ({ features }) as Upsell;

const unrelatedFeature: Upsell['features'][number] = { id: 'storage', text: 'Some other feature' };

describe('upsellsShowB2BUsersRow', () => {
    it('matches the users feature', () => {
        expect(upsellsShowB2BUsersRow([buildUpsell([getUsersFeature(3)])])).toBe(true);
    });

    it('does not match unrelated features', () => {
        expect(upsellsShowB2BUsersRow([buildUpsell([unrelatedFeature])])).toBe(false);
    });

    it('matches any upsell in the list', () => {
        expect(upsellsShowB2BUsersRow([buildUpsell([unrelatedFeature]), buildUpsell([getUsersFeature(3)])])).toBe(true);
    });

    it('returns false without upsells', () => {
        expect(upsellsShowB2BUsersRow([])).toBe(false);
    });

    /**
     * These three only match because the check used to key off the users icon, which they
     * all render. They are expected to stop matching when the list is narrowed to the
     * users feature.
     */
    it.each([
        ['contact groups', getContactGroupsManagement()],
        ['max participants', getMaxParticipants(50)],
        ['manage user permissions', getManageUserPermissionsAndAccessFeature()],
    ])('still matches %s, inherited from the icon-based check', (_name, feature) => {
        expect(upsellsShowB2BUsersRow([buildUpsell([feature])])).toBe(true);
    });
});
