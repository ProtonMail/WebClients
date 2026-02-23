import { useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { InputFieldTwo, PasswordInputTwo, useFormErrors } from '@proton/components';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { createPreAuthKTVerifier } from '@proton/key-transparency/shared';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getPersistedSessionByUID } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { APPS, BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getMinPasswordLengthMessage, passwordLengthValidator } from '@proton/shared/lib/helpers/formValidators';
import { type Api, KeyTransparencyActivation, type User } from '@proton/shared/lib/interfaces';
import { handleSetupKeys } from '@proton/shared/lib/keys';

const handleSetup = async ({ user, password, api, uid }: { user: User; password: string; api: Api; uid: string }) => {
    const { preAuthKTVerify, preAuthKTCommit } = createPreAuthKTVerifier(KeyTransparencyActivation.DISABLED);
    const addresses = await getAllAddresses(api);

    const keyPassword = await handleSetupKeys({
        api,
        addresses,
        password,
        preAuthKTVerify,
        product: APPS.PROTONVPN_SETTINGS,
    });

    if (uid !== undefined) {
        const session = getPersistedSessionByUID(uid);
        if (session) {
            await persistSession({
                api,
                clearKeyPassword: password,
                keyPassword,
                User: user,
                UID: session.UID,
                LocalID: session.localID,
                persistent: session.persistent,
                trusted: session.trusted,
                mode: 'sso',
                // Upgrade the session to a proton session (since we keep full scope)
                source: SessionSource.Proton,
            });
        }
    }

    await preAuthKTCommit(user.ID, api);
};

const OAuthSetPasswordForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const [user] = useUser();
    const api = useApi();
    const [password, setPassword] = useState('');
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const authentication = useAuthentication();
    const handleError = useErrorHandler();

    return (
        <form
            name="loginForm"
            onSubmit={(event) => {
                event.preventDefault();
                if (!onFormSubmit()) {
                    return;
                }
                withLoading(handleSetup({ api, user, uid: authentication.UID, password }))
                    .then(() => {
                        onSuccess();
                    })
                    .catch((error) => {
                        handleError(error);
                    });
            }}
            method="post"
        >
            <div className="mb-4">
                {c('Info')
                    .t`Enter a password to finalize your ${BRAND_NAME} Account and start using ${VPN_APP_NAME} across all your devices!`}
            </div>
            <InputFieldTwo id="username" label={c('Label').t`Email`} readOnly={true} value={user.Email} />
            <InputFieldTwo
                as={PasswordInputTwo}
                id="password"
                label={c('Label').t`New password`}
                assistiveText={getMinPasswordLengthMessage()}
                error={validator([passwordLengthValidator(password)])}
                disableChange={loading}
                autoFocus
                autoComplete="new-password"
                value={password}
                onValue={setPassword}
            />
            <div className="mt-8">
                <Button type="submit" color="norm" fullWidth loading={loading}>
                    {c('Action').t`Save and continue`}
                </Button>
            </div>
        </form>
    );
};

export default OAuthSetPasswordForm;
