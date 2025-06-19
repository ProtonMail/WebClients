import type { Peer } from './WireGuardConfigurationSection';
import { PLATFORM, getConfigTemplate } from './WireGuardConfigurationSection';

describe('WireGuardConfigurationSection getConfigTemplate', () => {
    const mockPeer: Peer = {
        name: 'TestServer',
        publicKey: 'testPublicKey',
        ip: '192.168.1.1',
        label: 'test-label',
    };

    const interfacePrivateKey = 'testPrivateKey';
    const deviceName = 'TestDevice';

    describe('AllowedIPs configuration', () => {
        const platforms = [
            PLATFORM.WINDOWS,
            PLATFORM.LINUX,
            PLATFORM.MACOS,
            PLATFORM.ANDROID,
            PLATFORM.IOS,
            PLATFORM.ROUTER,
        ];

        it.each(platforms)('should always use 0.0.0.0/0 for AllowedIPs in %s platform', (platform) => {
            const features = {
                platform,
                peerName: mockPeer.name,
                peerPublicKey: mockPeer.publicKey,
                peerIp: mockPeer.ip,
            };

            const config = getConfigTemplate(interfacePrivateKey, deviceName, features, mockPeer);

            expect(config).toContain('AllowedIPs = 0.0.0.0/0');
        });
    });
});
