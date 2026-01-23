import type { Peer } from './peer';

export enum PLATFORM {
    MACOS = 'macOS',
    LINUX = 'Linux',
    WINDOWS = 'Windows',
    ANDROID = 'Android',
    IOS = 'iOS',
    ROUTER = 'Router',
}

export interface ExtraCertificateFeatures {
    peerName: Peer['name'];
    peerPublicKey: Peer['publicKey'];
    peerIp: Peer['ip'];
    label: Peer['label'];
    platform: PLATFORM;
}
