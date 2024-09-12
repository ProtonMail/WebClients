import { APPS } from '@proton/shared/lib/constants';

export const ForkVersion = 2;

export enum ForkType {
    SWITCH = '1',
    // Used in VPN extension
    SIGNUP = '2',
}

export const ForkableApps = new Set(
    [
        APPS.PROTONMAIL,
        APPS.PROTONCONTACTS,
        APPS.PROTONDRIVE,
        APPS.PROTONCALENDAR,
        APPS.PROTONPASS,
        APPS.PROTONDOCS,
        APPS.PROTONEXTENSION,
        APPS.PROTONPASSBROWSEREXTENSION,
        APPS.PROTONVPNBROWSEREXTENSION,
        APPS.PROTONWALLET,
    ].filter(Boolean)
);

export enum ForkSearchParameters {
    App = 'app',
    State = 'state',
    Base64Key = 'sk',
    Version = 'v',
    LocalID = 'u',
    ForkType = 't',
    Persistent = 'p',
    Trusted = 'tr',
    Prompt = 'prompt',
    Independent = 'independent',
    PayloadType = 'pt',
    Selector = 'selector',
    PayloadVersion = 'pv',
    PromptType = 'promptType',
    Plan = 'plan',
}

export enum ExtraSessionForkSearchParameters {
    Email = 'email',
}

export const returnUrlContextKey = 'returnUrlContext';
export const returnUrlKey = 'returnUrl';
