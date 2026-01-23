import { getConfigTemplate } from './getConfigTemplate';
import type { Peer } from './peer';

jest.mock('@proton/components/helpers/getObjectKeys', () => ({
    getObjectKeys: jest.fn((obj) => (obj ? Object.keys(obj) : [])),
}));

jest.mock('./feature', () => ({
    formatFeatureShortName: jest.fn(),
    formatFeatureValue: jest.fn(),
    getKeyOfCheck: jest.fn(() => (key: string) => ['peerIp', 'peerName', 'peerPublicKey', 'platform'].includes(key)),
}));

describe('getConfigTemplate', () => {
    const mockInterfacePrivateKey = 'mock-private-key-123';
    const mockPeer: Peer = {
        name: 'Test Peer',
        publicKey: 'mock-public-key-456',
        ip: '192.168.1.1',
        ipv6: '2001:db8::1',
        label: 'foo',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic functionality', () => {
        it('should generate config with minimal parameters', () => {
            const result = getConfigTemplate(mockInterfacePrivateKey, undefined, undefined, mockPeer);

            expect(result).toContain('[Interface]');
            expect(result).toContain(`PrivateKey = ${mockInterfacePrivateKey}`);
            expect(result).toContain('Address = 10.2.0.2/32');
            expect(result).toContain('DNS = 10.2.0.1');
            expect(result).toContain('[Peer]');
            expect(result).toContain(`# ${mockPeer.name}`);
            expect(result).toContain(`PublicKey = ${mockPeer.publicKey}`);
            expect(result).toContain(`Endpoint = ${mockPeer.ip}:51820`);
            expect(result).toContain('AllowedIPs = 0.0.0.0/0, ::/0');
            expect(result).toContain('PersistentKeepalive = 25');
        });

        it('should include name comment when name is provided', () => {
            const name = 'Test User';
            const result = getConfigTemplate(mockInterfacePrivateKey, name, undefined, mockPeer);

            expect(result).toContain(`# Key for ${name}`);
        });

        it('should not include name comment when name is undefined', () => {
            const result = getConfigTemplate(mockInterfacePrivateKey, undefined, undefined, mockPeer);

            expect(result).not.toContain('# Key for');
        });
    });

    describe('IPv6 support', () => {
        it('should include IPv6 address when isIpv6ForWgConfig is true and peer has ipv6', () => {
            const result = getConfigTemplate(mockInterfacePrivateKey, undefined, undefined, mockPeer, true);

            expect(result).toContain(`Address = 10.2.0.2/32, 2a07:b944::2:2/128`);
            expect(result).toContain(`DNS = 10.2.0.1, 2a07:b944::2:1`);
            expect(result).toContain(
                `# Uncomment the following line (delete the # symbol) to connect to Proton VPN using IPv6.`
            );
            expect(result).toContain(`# Endpoint = [${mockPeer.ipv6}]:51820`);
        });

        it('should not include IPv6 address when isIpv6ForWgConfig is false', () => {
            const result = getConfigTemplate(mockInterfacePrivateKey, undefined, undefined, mockPeer, false);

            expect(result).toContain('Address = 10.2.0.2/32');
            expect(result).not.toContain('/128');
            expect(result).toContain('DNS = 10.2.0.1');
        });

        it('should not include IPv6 address when peer has no ipv6', () => {
            const peerWithoutIpv6 = { ...mockPeer, ipv6: undefined };
            const result = getConfigTemplate(mockInterfacePrivateKey, undefined, undefined, peerWithoutIpv6, true);

            expect(result).toContain('Address = 10.2.0.2/32');
            expect(result).not.toContain('/128');
        });
    });
});
