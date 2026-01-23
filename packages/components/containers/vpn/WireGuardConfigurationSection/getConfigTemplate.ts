import { getObjectKeys } from '@proton/components/helpers/getObjectKeys';

import { type FeaturesValues, formatFeatureShortName, formatFeatureValue, getKeyOfCheck } from './feature';
import type { ExtraCertificateFeatures } from './features';
import type { Peer } from './peer';

const isExtraFeatureKey = getKeyOfCheck<ExtraCertificateFeatures>(['peerIp', 'peerName', 'peerPublicKey', 'platform']);

export const getConfigTemplate = (
    interfacePrivateKey: string,
    name: string | undefined,
    features: Partial<FeaturesValues & ExtraCertificateFeatures> | undefined,
    peer: Peer,
    isIpv6ForWgConfig = false
): string => {
    const featureIPv6 = isIpv6ForWgConfig && peer.ipv6;

    return `[Interface]${name ? `\n# Key for ${name}` : ''}${getObjectKeys(features)
        .map((key) =>
            isExtraFeatureKey(key) ? '' : `\n# ${formatFeatureShortName(key)} = ${formatFeatureValue(features, key)}`
        )
        .join('')}
PrivateKey = ${interfacePrivateKey}
Address = 10.2.0.2/32${featureIPv6 ? ', 2a07:b944::2:2/128' : ''}
DNS = 10.2.0.1${featureIPv6 ? ', 2a07:b944::2:1' : ''}

[Peer]
# ${features?.peerName || peer.name}
PublicKey = ${features?.peerPublicKey || peer.publicKey}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = ${features?.peerIp || peer.ip}:51820
${
    featureIPv6
        ? `
# Uncomment the following line (delete the # symbol) to connect to Proton VPN using IPv6.
# Endpoint = [${peer.ipv6}]:51820`
        : ''
}
PersistentKeepalive = 25`;
};
