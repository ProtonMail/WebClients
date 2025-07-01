import { APPS } from '@proton/shared/lib/constants';

export const ForkVersion = 2;

export enum ForkType {
    SWITCH = '1',
    SIGNUP = '2',
    LOGIN = '3',
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
        APPS.PROTONLUMO,
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
    Source = 'source',
    Selector = 'selector',
    PayloadVersion = 'pv',
    PromptType = 'promptType',
    PromptBypass = 'promptBypass',
    Plan = 'plan',
    PartnerId = 'partnerId',
    UnauthenticatedReturnUrl = 'uru',
}

export enum ExtraSessionForkSearchParameters {
    Email = 'email',
}
