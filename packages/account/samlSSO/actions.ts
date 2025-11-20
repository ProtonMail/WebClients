import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { setupSCIM as setupSCIMConfig, updateSCIM as updateSCIMConfig } from '@proton/shared/lib/api/samlSSO';
import { generateRandomBytes } from '@proton/shared/lib/helpers/crypto';
import type { Api } from '@proton/shared/lib/interfaces';

import { type SamlState, selectSamlSSO, updateScim } from './index';

export const disableSCIMAction = ({
    api,
}: {
    api: Api;
}): ThunkAction<Promise<void>, SamlState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await api(updateSCIMConfig({ State: 0 }));
        dispatch(updateScim({ baseUrl: '', state: 0 }));
    };
};

export const setupSCIMAction = ({
    type,
    api,
}: {
    type: 'setup' | 'generated';
    api: Api;
}): ThunkAction<Promise<{ token: string; baseUrl: string }>, SamlState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState) => {
        const token = generateRandomBytes(20);
        const base64Token = token.toBase64();
        const config =
            type === 'setup'
                ? setupSCIMConfig({ Password: base64Token })
                : updateSCIMConfig({
                      State: 1,
                      Password: base64Token,
                  });

        const result = await api<{ SCIMBaseURL: string | undefined }>(config);

        const scimInfo = selectSamlSSO(getState())?.value?.scimInfo;
        const baseUrl = result?.SCIMBaseURL || scimInfo?.baseUrl || '';

        dispatch(updateScim({ baseUrl, state: 1 }));

        return {
            token: base64Token,
            baseUrl,
        };
    };
};
