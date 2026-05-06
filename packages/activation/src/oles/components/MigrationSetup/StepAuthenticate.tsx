import type { FC } from 'react';

import { c } from 'ttag';

import { createToken } from '@proton/activation/src/api';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import { EASY_SWITCH_FEATURES, EASY_SWITCH_SOURCES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { type OAuthToken, deleteOAuthTokenThunk, oauthTokenActions } from '@proton/activation/src/logic/oauthToken';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Href } from '@proton/atoms/Href/Href';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { useErrorHandler, useNotifications } from '@proton/components/index';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import googleLogoMono from '@proton/styles/assets/img/import/providers/google_mono.svg';

import { CircledLogoWithProton } from '../CircledLogoWithProton';
import type { StepComponentProps } from './MigrationSetup';

const StepAuthenticate: FC<{ tokens?: OAuthToken[] } & StepComponentProps> = ({ tokens, submitButton }) => {
    const api = useSilentApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();

    const { triggerOAuthPopup } = useOAuthPopup({
        errorMessage: c('BOSS').t`Failed to load OAuth`,
    });

    const handleAddToken = () => {
        void triggerOAuthPopup({
            features: [EASY_SWITCH_FEATURES.OLES],
            provider: OAUTH_PROVIDER.GSUITE,
            callback: async ({ Code, RedirectUri }) => {
                try {
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

                    createNotification({
                        text: c('BOSS').t`Account connected`,
                    });
                } catch (err) {
                    handleError(err);
                }
            },
        });
    };

    const handleDeleteToken = (token: OAuthToken) => async () => {
        await dispatch(deleteOAuthTokenThunk(token.ID));

        createNotification({
            text: c('BOSS').t`Account disconnected`,
        });
    };

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <h3 className="text-4xl text-bold mb-2">{c('BOSS').t`Authenticate your Google Workspace account`}</h3>
            <p className="color-weak mt-0 mb-8">
                {c('BOSS')
                    .t`You need to grant the permission for ${BRAND_NAME} to copy your data. After accepting permissions, come back here to continue.`}{' '}
                <Href href="#">{c('Link').t`Learn more`}</Href>
            </p>
            {tokens && Boolean(tokens.length) && (
                <div className="flex flex-nowrap border border-weak rounded-xxl justify-space-between p-4 items-center mb-8">
                    <div className="flex flex-nowrap gap-4 items-center">
                        <CircledLogoWithProton iconPosition="inside-bottom-right" className="shrink-0" />
                        <div>
                            <div className="text-semibold text-ellipsis" title={tokens[0].Account}>
                                {tokens[0].Account}
                            </div>
                            <div className="text-sm color-weak text-ellipsis" title="Google Workspace">
                                {c('BOSS').t`Google Workspace account`}
                            </div>
                        </div>
                    </div>
                    <Button
                        icon
                        shape="outline"
                        color="danger"
                        className="shrink-0 rounded-lg"
                        onClick={handleDeleteToken(tokens[0])}
                    >
                        <IcTrash alt={c('Action').t`Delete token ${tokens[0].Account}`} />
                    </Button>
                </div>
            )}
            {tokens && !tokens.length && (
                <Button color="norm" onClick={handleAddToken} className="flex items-center text-semibold">
                    <img src={googleLogoMono} width={18} height={18} alt="" className="mr-2" />
                    {c('BOSS').t`Sign in to Google Workspace`}
                </Button>
            )}
            {!tokens && <CircleLoader />}
            {submitButton && <div className="mt-8 flex justify-end">{submitButton}</div>}
        </div>
    );
};

export default StepAuthenticate;
