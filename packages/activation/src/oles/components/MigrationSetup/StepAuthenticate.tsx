import type { FC } from 'react';

import { c } from 'ttag';

import { createToken } from '@proton/activation/src/api';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import { EASY_SWITCH_FEATURES, EASY_SWITCH_SOURCES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { type OAuthToken, oauthTokenActions } from '@proton/activation/src/logic/oauthToken';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import useApi from '@proton/components/hooks/useApi';
import { useDispatch } from '@proton/redux-shared-store';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import googleLogo from '@proton/styles/assets/img/import/providers/google_mono.svg';

import type { MigrationSetupModel } from '../../types';

const StepAuthenticate: FC<{ model: MigrationSetupModel }> = () => {
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
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <p className="text-xl text-bold mb-2">{c('BOSS').t`Authenticate your Google Workspace account`}</p>
            <p className="color-weak mt-0">
                {c('BOSS')
                    .t`You need to grant the permission for ${BRAND_NAME} to copy your data. After accepting permissions, come back here to continue.`}{' '}
                <Href href="#">{c('Link').t`Learn more`}</Href>
            </p>
            <Button color="norm" onClick={onClick} className="flex items-center text-semibold">
                <img src={googleLogo} width={18} height={18} alt="" className="mr-2" />
                {c('BOSS').t`Sign in to Google Workspace`}
            </Button>
        </div>
    );
};

export default StepAuthenticate;
