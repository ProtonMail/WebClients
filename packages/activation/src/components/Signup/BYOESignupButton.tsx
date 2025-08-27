import type { RefObject } from 'react';

import { SignupType } from 'proton-account/src/app/signup/interfaces';
import { c } from 'ttag';

import { createSignupOAuthToken } from '@proton/activation/src/api';
import { type CreateSignupOAuthTokenResponse } from '@proton/activation/src/api/api.interface';
import AddBYOEModal from '@proton/activation/src/components/Modals/AddBYOEModal/AddBYOEModal';
import { openOAuthPopup } from '@proton/activation/src/helpers/oAuthPopup';
import { generateGoogleOAuthUrl, getOAuthRedirectURL } from '@proton/activation/src/hooks/useOAuthPopup.helpers';
import {
    EASY_SWITCH_FEATURES,
    EASY_SWITCH_SOURCES,
    type ImportProvider,
    OAUTH_PROVIDER,
    type OAuthProps,
} from '@proton/activation/src/interface';
import { InlineLinkButton } from '@proton/atoms';
import { Icon, useModalState } from '@proton/components';
import ProtonLogo from '@proton/components/components/logo/ProtonLogo';
import useApi from '@proton/components/hooks/useApi';
import { useLoading } from '@proton/hooks/index';
import { useVariant } from '@proton/unleash';

interface Props {
    provider?: ImportProvider | OAUTH_PROVIDER;
    onEmailValue: (value: string) => void;
    signupType: SignupType;
    setSignupType: (signupType: SignupType) => void;
    onUseInternalAddress: () => void;
    passwordInputRef: RefObject<HTMLInputElement>;
}

const BYOESignupButton = ({
    provider = OAUTH_PROVIDER.GOOGLE,
    onEmailValue,
    signupType,
    setSignupType,
    onUseInternalAddress,
    passwordInputRef,
}: Props) => {
    const variant = useVariant('InboxBringYourOwnEmailSignup');
    const api = useApi();
    const [addBYOEModalProps, setAddBYOEModalOpen, renderAddBYOEModal] = useModalState();
    const [loading, withLoading] = useLoading();

    const callback = async (oauthProps: OAuthProps) => {
        try {
            const result = await withLoading<CreateSignupOAuthTokenResponse>(
                api(
                    createSignupOAuthToken({
                        ...oauthProps,
                        Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SIGNUP,
                        Features: [EASY_SWITCH_FEATURES.BYOE],
                    })
                )
            );

            if (result) {
                onEmailValue(result.ValidatedOAuthTokenOutput.Account);
                setSignupType(SignupType.BringYourOwnEmail);
            }
        } catch {}

        setAddBYOEModalOpen(false);
        // Need to add a timeout because closing the modal would remove the focus from the input
        setTimeout(() => passwordInputRef.current?.focus(), 200);
    };

    const handleShowOauthPopup = async () => {
        const redirectUri = getOAuthRedirectURL(provider);
        const authorizationUrl = generateGoogleOAuthUrl({
            redirectUri,
            features: [EASY_SWITCH_FEATURES.BYOE],
        });

        const errorMessage = c('loc_nightly: BYOE').t`Something went wrong while connecting your Gmail address`;

        void openOAuthPopup({ authorizationUrl, redirectUri, provider, callback, errorMessage });
    };

    if (variant.name === 'Control') {
        return null;
    }

    return (
        <div className="text-center mb-4">
            {signupType === SignupType.BringYourOwnEmail ? (
                <InlineLinkButton id="add-byoe" className="inline-flex items-center" onClick={onUseInternalAddress}>
                    <ProtonLogo variant="glyph-only" size={4} className="mr-2" />
                    {c('loc_nightly: BYOE').t`Get a new encrypted address`}
                </InlineLinkButton>
            ) : (
                <InlineLinkButton
                    id="add-byoe"
                    className="inline-flex items-center"
                    onClick={() => setAddBYOEModalOpen(true)}
                >
                    {variant.name === 'Bold' ? (
                        <>
                            <Icon name="brand-google" className="mr-2" />
                            {c('loc_nightly: BYOE').t`Use my Gmail address`}
                        </>
                    ) : (
                        c('loc_nightly: BYOE').t`Use my current email address`
                    )}
                </InlineLinkButton>
            )}

            {renderAddBYOEModal && (
                <AddBYOEModal {...addBYOEModalProps} onSubmit={handleShowOauthPopup} isLoading={loading} />
            )}
        </div>
    );
};

export default BYOESignupButton;
