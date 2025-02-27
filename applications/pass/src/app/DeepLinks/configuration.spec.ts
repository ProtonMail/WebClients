import { DEEPLINK_CONFIG, getDeeplinkFallbackURL, getDeeplinkURLPrefix } from './configuration';

describe('DeepLinks configuration', () => {
    describe('`getDeeplinkURLPrefix`', () => {
        test('should extract prefix correctly', () => {
            expect(getDeeplinkURLPrefix('/u/34/internal/some/path')).toBe('/u/34');
            expect(getDeeplinkURLPrefix('pass.proton.me/u/0/internal/some/path')).toBe('pass.proton.me/u/0');
            expect(getDeeplinkURLPrefix('#/u/42/internal/some/path')).toBe('#/u/42');
        });
    });

    describe('`getDeeplinkFallbackURL`', () => {
        test('should return root path', () => {
            expect(getDeeplinkFallbackURL()).toBe('/');
        });
    });

    describe('`DEEPLINK_CONFIG`', () => {
        test('should handle "address_breach"', () => {
            const params = new URLSearchParams('AddressID=test-id');
            const result = DEEPLINK_CONFIG.address_breach(params);
            expect(result).toBe('/monitor/dark-web/proton/test-id');
        });

        test('should handle "alias_breach"', () => {
            const params = new URLSearchParams('ShareID=share-id&ItemID=item-id');
            const result = DEEPLINK_CONFIG.alias_breach(params);
            expect(result).toBe('/monitor/dark-web/alias/share-id:item-id');
        });

        test('should handle "alias_management"', () => {
            const params = new URLSearchParams();
            const result = DEEPLINK_CONFIG.alias_management(params);
            expect(result).toBe('/settings#aliases');
        });

        test('should handle "custom_email_breach"', () => {
            const params = new URLSearchParams('CustomEmailID=custom-id');
            const result = DEEPLINK_CONFIG.custom_email_breach(params);
            expect(result).toBe('/monitor/dark-web/custom/custom-id');
        });

        test('should handle "share_members"', () => {
            const params = new URLSearchParams('ShareID=share-id');
            const result = DEEPLINK_CONFIG.share_members(params);
            expect(result).toBe('/share/share-id');
        });

        test('should handle view_item', () => {
            const params = new URLSearchParams('ShareID=share-id&ItemID=item-id');
            const result = DEEPLINK_CONFIG.view_item(params);
            expect(result).toBe('/share/share-id/item/item-id');
        });
    });
});
