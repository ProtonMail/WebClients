import type { FC } from 'react';

import { c } from 'ttag';

import { createToken } from '@proton/activation/src/api';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import { EASY_SWITCH_FEATURES, EASY_SWITCH_SOURCES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { type OAuthToken, deleteOAuthTokenThunk, oauthTokenActions } from '@proton/activation/src/logic/oauthToken';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import useApi from '@proton/components/hooks/useApi';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { useDispatch } from '@proton/redux-shared-store';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';
import googleLogoMono from '@proton/styles/assets/img/import/providers/google_mono.svg';

const StepAuthenticate: FC<{ token?: OAuthToken }> = ({ token }) => {
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
            {token ? (
                <div className="flex border border-weak rounded justify-space-between p-4 items-center mb-8">
                    <div className="flex gap-2 items-center">
                        <img src={googleLogo} alt="" className="border rounded p-1 shrink-0" width={32} />
                        <div>
                            <div className="text-semibold">{token.Account}</div>
                            <div className="text-sm color-weak">Google Workspace</div>
                        </div>
                    </div>
                    <Button icon shape="ghost" color="danger" onClick={() => dispatch(deleteOAuthTokenThunk(token.ID))}>
                        <IcTrash alt={c('Action').t`Delete token ${token.Account}`} />
                    </Button>
                </div>
            ) : (
                <Button color="norm" onClick={onClick} className="flex items-center text-semibold">
                    <img src={googleLogoMono} width={18} height={18} alt="" className="mr-2" />
                    {c('BOSS').t`Sign in to Google Workspace`}
                </Button>
            )}
        </div>
    );
};

export default StepAuthenticate;
