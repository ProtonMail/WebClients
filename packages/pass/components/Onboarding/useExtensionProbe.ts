import { useEffect, useState } from 'react';

import { getAppHref } from '@proton/shared/lib/apps/helper';
import {
    ExtraSessionForkSearchParameters,
    ForkSearchParameters,
    ForkType,
} from '@proton/shared/lib/authentication/fork/constants';
import type { ExtensionMessageResponse, PassInstalledMessage } from '@proton/shared/lib/browser/extension';
import { sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import getRandomString from '@proton/utils/getRandomString';

import { clients } from '../../clients';
import { Clients } from '../../constants';
import { getBrowserClient } from '../../lib/extension/utils/browser';
import type { Maybe, MaybeNull } from '../../types';
import type { ToolbarPinState } from '../../types/browser';
import { UNIX_HOUR } from '../../utils/time/constants';
import { getEpoch } from '../../utils/time/epoch';

const SIGNUP_EMAIL_STORAGE_KEY = 'proton-signup-email';
/** Bridges signup to the extension install on a possibly shared machine: keep it short */
const SIGNUP_EMAIL_TTL = UNIX_HOUR;
const MESSAGE_TYPE_ACCOUNT_PROBE_2 = 'pass-account-probe';

type PassCheckPayload = {
    authenticated: boolean;
    /** Absent when talking to an extension predating the pin probe */
    pinned: Maybe<ToolbarPinState>;
    /** Only set when authenticated */
    url: MaybeNull<string>;
};

const getInstallUrl = () => clients[getBrowserClient() ?? Clients.Chrome].link;

const getOnboardingUrl = (url: string) => {
    return `${url}onboarding.html#/welcome`;
};

const getExtensionForkUrl = (extraParams: Record<string, string>) => {
    const params = new URLSearchParams({
        [ForkSearchParameters.App]: APPS.PROTONPASSBROWSEREXTENSION,
        [ForkSearchParameters.State]: getRandomString(32),
        [ForkSearchParameters.Independent]: '0',
        [ForkSearchParameters.Prompt]: 'login',
        [ForkSearchParameters.PromptBypass]: 'sso',
        [ForkSearchParameters.PromptType]: 'offline',
        [ForkSearchParameters.PayloadType]: 'offline',
        ...extraParams,
    });
    return `${getAppHref(SSO_PATHS.AUTHORIZE, APPS.PROTONACCOUNT)}?${params.toString()}`;
};

export const getLoginUrl = (email: MaybeNull<string>) =>
    getExtensionForkUrl(email ? { [ExtraSessionForkSearchParameters.Email]: email } : {});

/** Apple store rules: Safari signups stay on the free plan */
export const getSignupForkUrl = () =>
    getExtensionForkUrl({
        [ForkSearchParameters.ForkType]: ForkType.SIGNUP,
        ...(isSafari() && { [ForkSearchParameters.Plan]: 'free' }),
    });

/** Safari always shows the action icon, and its extension may never answer the
 * probe at all when site permissions are withheld — so settle it here rather
 * than depending on a payload that might not arrive. */
const resolvePinState = (reported: Maybe<ToolbarPinState>): ToolbarPinState =>
    isSafari() ? 'pinned' : (reported ?? 'unknown');

type StoredSignupEmail = { email: string; expiresAt: number };

const storeSignupEmail = (email: string) => {
    const value: StoredSignupEmail = { email, expiresAt: getEpoch() + SIGNUP_EMAIL_TTL };
    setItem(SIGNUP_EMAIL_STORAGE_KEY, JSON.stringify(value));
};

const readSignupEmail = (): MaybeNull<string> => {
    const stored = getItem(SIGNUP_EMAIL_STORAGE_KEY);
    if (!stored) return null;

    try {
        const { email, expiresAt } = JSON.parse(stored) as StoredSignupEmail;
        if (expiresAt > getEpoch()) return email;
    } catch {}

    removeItem(SIGNUP_EMAIL_STORAGE_KEY);
    return null;
};

/** Only the email handed over by signup is persisted,
 * so revisits never extend the TTL */
const resolveSignupEmail = (signupEmail: MaybeNull<string>): MaybeNull<string> => {
    if (signupEmail) storeSignupEmail(signupEmail);
    return signupEmail || readSignupEmail();
};

export enum ProbeState {
    /** Checking authentication in progress */
    CHECKING = 0,
    /** The extension could not be found */
    MISSING = 1,
    /** Extension has been found but it's not logged in,
     * or it predates the account probe and can't tell */
    UNAUTH = 2,
    /** Extension has been found and is logged in */
    AUTH = 3,
    /** Extension has been found, is not logged
     * but we have a signup email so we can redirect to login */
    AUTO_LOGIN = 4,
}

type ExtensionProbeState = {
    state: ProbeState;
    link: MaybeNull<string>;
    /** `unknown` when the browser withholds it, the extension is too old to
     * report it, or we never reached the extension — except on Safari, which
     * is always `pinned`. See {@link resolvePinState}. */
    pinned: ToolbarPinState;
};

const resolveProbeState = (
    result: ExtensionMessageResponse<PassCheckPayload>,
    legacyResult: ExtensionMessageResponse,
    email: MaybeNull<string>
): ExtensionProbeState => {
    if (result.type === 'error') {
        /** Extensions released before the account probe only answer `pass-installed`:
         * installed, auth state unknown — offer sign-in without auto-redirecting */
        return legacyResult.type === 'success'
            ? { state: ProbeState.UNAUTH, link: getLoginUrl(email), pinned: resolvePinState(undefined) }
            : { state: ProbeState.MISSING, link: getInstallUrl(), pinned: resolvePinState(undefined) };
    }

    const { authenticated, pinned: reportedPinned, url: extUrl } =
        // There's a bug in the sendExtensionMessage return type
        result as unknown as PassCheckPayload;

    const pinned = resolvePinState(reportedPinned);

    if (authenticated && extUrl) return { state: ProbeState.AUTH, link: getOnboardingUrl(extUrl), pinned };
    if (email) return { state: ProbeState.AUTO_LOGIN, link: getLoginUrl(email), pinned };
    return { state: ProbeState.UNAUTH, link: getLoginUrl(email), pinned };
};

/** `signupEmail` is the address just signed up with, when coming from signup */
export const useExtensionProbe = (signupEmail: MaybeNull<string> = null) => {
    const [state, setState] = useState<ExtensionProbeState>({
        state: ProbeState.CHECKING,
        link: null,
        pinned: resolvePinState(undefined),
    });

    useEffect(() => {
        const checkExtension = async () => {
            try {
                /** Persisted before probing: the message timeout can be
                 * long and the user may navigate away in the meantime */
                const email = resolveSignupEmail(signupEmail);

                const [result, legacyResult] = await Promise.all([
                    sendExtensionMessage<PassCheckPayload>(
                        { type: MESSAGE_TYPE_ACCOUNT_PROBE_2 },
                        { app: APPS.PROTONPASSBROWSEREXTENSION }
                    ),
                    sendExtensionMessage({ type: 'pass-installed' } satisfies PassInstalledMessage, {
                        app: APPS.PROTONPASSBROWSEREXTENSION,
                    }),
                ]);

                const probeState = resolveProbeState(result, legacyResult, email);
                if (probeState.state !== ProbeState.MISSING) removeItem(SIGNUP_EMAIL_STORAGE_KEY);
                setState(probeState);
            } catch (error) {
                setState({ state: ProbeState.MISSING, link: getInstallUrl(), pinned: resolvePinState(undefined) });
                console.warn('checkExtension error', error);
            }
        };

        void checkExtension();
    }, []);

    return state;
};
