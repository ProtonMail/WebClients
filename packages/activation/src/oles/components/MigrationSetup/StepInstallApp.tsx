import type { FC } from 'react';

import { c } from 'ttag';

import { createToken } from '@proton/activation/src/api';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import { EASY_SWITCH_FEATURES, EASY_SWITCH_SOURCES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { type OAuthToken, oauthTokenActions } from '@proton/activation/src/logic/oauthToken';
import { Button } from '@proton/atoms/Button/Button';
import useApi from '@proton/components/hooks/useApi';
import { useDispatch } from '@proton/redux-shared-store';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { MigrationSetupModel } from '../../types';

const StepInstallApp: FC<{ model: MigrationSetupModel }> = () => {
    const api = useApi();
    const dispatch = useDispatch();

    const { triggerOAuthPopup } = useOAuthPopup({
        errorMessage: c('BOSS').t`Failed to load OAuth`,
    });

    const onClick = () => {
        void triggerOAuthPopup({
            features: [EASY_SWITCH_FEATURES.OLES],
            provider: OAUTH_PROVIDER.GSUITE,
            callback: async ({ Code, RedirectUri }) => {
                const { Tokens } = await api<{ Tokens: OAuthToken[] }>(
                    createToken({
                        Code,
                        RedirectUri,
                        Features: [EASY_SWITCH_FEATURES.OLES],
                        Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                        Provider: OAUTH_PROVIDER.GSUITE,
                    })
                );

                dispatch(oauthTokenActions.updateTokens(Tokens));
            },
        });
    };

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '38rem' }}>
            <p className="text-xl text-bold mb-2">{c('BOSS').t`Install migration app`}</p>
            <p className="color-weak mt-0">
                {c('BOSS')
                    .t`To migrate your organization’s data, you need to install the ${BRAND_NAME} Migration Assistant app from the Google Workspace Marketplace. This will grant permission to ${BRAND_NAME} to copy your data. After installing it, come back here to continue. Learn more`}
            </p>
            <Button color="norm" onClick={onClick}>
                {c('BOSS').t`Sign in to Google Workspace`}
            </Button>
        </div>
    );
};

export default StepInstallApp;
