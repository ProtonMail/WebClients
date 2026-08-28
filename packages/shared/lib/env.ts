import { PROTON_LOCAL_DOMAIN } from './localDev';

export function isLocalHost(host: string) {
    return host.includes(PROTON_LOCAL_DOMAIN);
}

export function isLocalEnvironment() {
    return isLocalHost(window.location.host);
}

export function isDevOrBlackHost(host: string) {
    return isLocalHost(host) || host.endsWith('proton.black');
}

export function isDevOrBlack() {
    return isDevOrBlackHost(window.location.host);
}
