import type { FC } from 'react';

import { c } from 'ttag';

import { createToken } from '@proton/activation/src/api';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import { EASY_SWITCH_FEATURES, EASY_SWITCH_SOURCES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { type OAuthToken, deleteOAuthTokenThunk, oauthTokenActions } from '@proton/activation/src/logic/oauthToken';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Href } from '@proton/atoms/Href/Href';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';

import { useProviderTokens } from '../../useProviderTokens';
import { CircledLogoWithProton } from '../CircledLogoWithProton';
import type { StepComponentProps } from './MigrationSetup';

const StepAuthenticate: FC<StepComponentProps> = ({ onNext }) => {
    const api = useSilentApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();
    const [tokens] = useProviderTokens(OAUTH_PROVIDER.GSUITE, [EASY_SWITCH_FEATURES.OLES]);

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
            <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                <h3 className="text-4xl text-bold">{c('BOSS').t`Authenticate your Google Workspace account`}</h3>
                <div className="flex gap-2 shrink-0 text-semibold">
                    <Button
                        disabled={!onNext}
                        onClick={() => onNext?.()}
                        color="norm"
                        size="medium"
                        className="rounded-lg"
                    >
                        {c('Action').t`Next`}
                    </Button>
                </div>
            </div>
            <p className="color-weak mt-0">
                {c('BOSS')
                    .t`Sign-in with a Google Workspace administrator account for ${BRAND_NAME} to setup the migration.`}{' '}
                <Href href={getKnowledgeBaseUrl('/easy-switch-for-business')} className="inline-block">{c('Link')
                    .t`Learn more`}</Href>
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
                    <Tooltip title={c('Action').t`Sign out`}>
                        <Button
                            icon
                            shape="outline"
                            color="danger"
                            className="shrink-0 rounded-lg border-weak"
                            onClick={handleDeleteToken(tokens[0])}
                        >
                            <IcTrash alt={c('Action').t`Sign out of ${tokens[0].Account}`} />
                        </Button>
                    </Tooltip>
                </div>
            )}
            {tokens && !tokens.length && (
                <Button color="norm" onClick={handleAddToken} className="flex items-center text-semibold p-2 pr-6">
                    <img src={googleLogo} width={40} height={40} alt="" className="mr-4 bg-weak p-2 rounded" />
                    {c('BOSS').t`Sign in to Google Workspace`}
                </Button>
            )}
            {!tokens && <CircleLoader />}
        </div>
    );
};

export default StepAuthenticate;
