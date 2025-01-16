import type { AuthSession } from '@proton/components/containers/login/interface';
import { pushForkSession } from '@proton/shared/lib/api/auth';
import { type OAuthLastAccess, getOAuthLastAccess } from '@proton/shared/lib/api/oauth';
import { getClientID, isExtension } from '@proton/shared/lib/apps/helper';
import {
    produceExtensionFork,
    produceFork,
    produceForkConsumption,
    produceOAuthFork,
} from '@proton/shared/lib/authentication/fork';
import type { PushForkResponse } from '@proton/shared/lib/authentication/interface';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api } from '@proton/shared/lib/interfaces';

import type { AuthExtensionState } from '../../public/AuthExtension';
import { type ProduceForkData, SSOType } from '../fork/interface';
import type { Paths } from '../helper';
import type { LoginResult } from './interface';

export const getProduceForkLoginResult = async ({
    api,
    data,
    session,
}: {
    api: Api;
    data: ProduceForkData;
    session: AuthSession;
    paths: Paths;
}): Promise<LoginResult> => {
    if (data.type === SSOType.Proton) {
        const { forkParameters, searchParameters } = data.payload;
        const { app } = forkParameters;

        if (isExtension(app)) {
            const childClientID = getClientID(app);
            const { Selector: selector } = await api<PushForkResponse>(
                withUIDHeaders(
                    session.UID,
                    pushForkSession({
                        ChildClientID: childClientID,
                        Independent: forkParameters.independent ? 1 : 0,
                    })
                )
            );
            const result = await produceExtensionFork({
                app,
                payload: {
                    selector,
                    session,
                    forkParameters,
                },
            });

            const state: AuthExtensionState = { ...result, app };
            return {
                type: 'auth-ext',
                payload: state,
                location: {
                    pathname: '/auth-ext',
                },
            };
        }

        const produceForkPayload = await produceFork({
            api,
            session,
            forkParameters,
        });
        const url = new URL(produceForkConsumption(produceForkPayload, searchParameters));
        return {
            type: 'done',
            payload: {
                session,
                url,
            },
        };
    }

    if (data.type === SSOType.OAuth) {
        const { payload } = data;
        const UID = session.UID;
        const {
            Access: { Accepted },
        } = await api<{
            Access: OAuthLastAccess;
        }>(withUIDHeaders(UID, getOAuthLastAccess(payload.oauthData.clientID)));
        if (Accepted) {
            const url = new URL(await produceOAuthFork({ api, oauthData: payload.oauthData, UID }));
            return {
                type: 'done',
                payload: {
                    session,
                    url,
                },
            };
        }
        return {
            type: 'confirm-oauth',
            location: {
                pathname: SSO_PATHS.OAUTH_CONFIRM_FORK,
            },
            payload: {
                data,
                session,
            },
        };
    }

    throw new Error('Unknown fork type');
};
