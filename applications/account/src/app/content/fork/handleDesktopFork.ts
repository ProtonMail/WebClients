import { deserializeQrCodePayload } from '@proton/account/signInWithAnotherDevice/qrCodePayload';
import {
    type ProduceForkParametersFull,
    getProduceForkParameters,
    getValidatedApp,
} from '@proton/shared/lib/authentication/fork';
import { getValidatedProtonProtocol } from '@proton/shared/lib/authentication/fork/getValidatedProtonProtocol';
import {
    GetActiveSessionType,
    type GetActiveSessionsResult,
    getActiveSessions,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { Api } from '@proton/shared/lib/interfaces';

import type { ProduceDesktopForkParameters } from '../actions/desktopForkInterface';
import { type ProtonForkData, SSOType } from '../actions/forkInterface';
import type { Paths } from '../helper';

type DesktopForkResult = {
    type: 'switch';
    payload: { fork: ProtonForkData; activeSessionsResult: GetActiveSessionsResult };
};

const getProduceDesktopForkParameters = (
    searchParams: URLSearchParams,
    hashParams: URLSearchParams
): ProduceDesktopForkParameters => {
    let queryParamApp = (searchParams.get('app') || '').toLowerCase();
    // Add 'proton-' prefix if it's not present allow to pass 'mail' instead of 'proton-mail' for example.
    if (!queryParamApp.startsWith('proton-')) {
        queryParamApp = `proton-${queryParamApp}`;
    }
    const app = getValidatedApp(queryParamApp);

    if (!app) {
        throw new Error('Invalid app specified');
    }
    const maybeRedirectUrl = searchParams.get('redirectUrl') || '';
    const redirectUrl = getValidatedProtonProtocol(app, maybeRedirectUrl) ? maybeRedirectUrl : undefined;
    if (maybeRedirectUrl && !redirectUrl) {
        throw new Error('Invalid redirectUrl specified');
    }

    const qrCodePayload = deserializeQrCodePayload(hashParams.get('payload') || '');

    // Important that the app and child client id are the same so that we show the correct context when signing in.
    // For example, strip proton-pass to pass, and verify that ios-pass contains pass
    const strippedApp = app.replace('proton-', '');
    if (!qrCodePayload.childClientId.includes(strippedApp)) {
        throw new Error('ClientID and app mismatch');
    }

    return {
        app,
        redirectUrl,
        qrCodePayload,
    };
};

export const handleDesktopFork = async ({ api }: { api: Api; paths: Paths }): Promise<DesktopForkResult> => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));

    const desktopForkParameters = getProduceDesktopForkParameters(searchParams, hashParams);
    const forkParameters = getProduceForkParameters(searchParams);

    const activeSessionsResult = await getActiveSessions({ api, email: forkParameters.email });
    // Force the active session type to be "switch" here because we don't want the auto sign-in behavior so that the user is prompted to pick an account.
    const activeSessionsResultWithSwitch: GetActiveSessionsResult = {
        ...activeSessionsResult,
        type: GetActiveSessionType.Switch,
    };

    // Create synthetic fork parameters so that we can reuse most of the logic for standard web forks.
    const syntheticForkParameters: ProduceForkParametersFull = {
        ...forkParameters,
        localID: undefined,
        app: desktopForkParameters.app,
        // Force reauth for cli-pass
        // TODO: This can potentially be done for all pass forks, but starting out like this
        prompt: desktopForkParameters.qrCodePayload.childClientId === 'cli-pass' ? 'login' : forkParameters.prompt,
    };

    return {
        type: 'switch',
        payload: {
            fork: { type: SSOType.Proton, payload: { forkParameters: syntheticForkParameters, desktopForkParameters } },
            activeSessionsResult: activeSessionsResultWithSwitch,
        },
    } as const;
};
