import { getSharedServersPageAvailability } from './getSharedServersPageAvailability';

// The entitlement comes from the backend plan catalog, so the cases pass the entitlement check itself.
const getAvailability = ({
    hasVpnLocationFilter,
    canReadSharedServers,
}: {
    hasVpnLocationFilter: boolean;
    canReadSharedServers: boolean;
}) =>
    getSharedServersPageAvailability({
        entitlements: { hasVpnLocationFilter },
        permissions: { 'account.shared_server.read': canReadSharedServers },
    }).sharedServers;

describe('getSharedServersPageAvailability', () => {
    it('shows the page with the VPN location filter entitlement and account.shared_server.read', () => {
        expect(getAvailability({ hasVpnLocationFilter: true, canReadSharedServers: true })).toBe(true);
    });

    it('hides the page without the VPN location filter entitlement', () => {
        expect(getAvailability({ hasVpnLocationFilter: false, canReadSharedServers: true })).toBe(false);
    });

    it('hides the page without account.shared_server.read', () => {
        expect(getAvailability({ hasVpnLocationFilter: true, canReadSharedServers: false })).toBe(false);
    });
});
