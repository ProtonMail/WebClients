import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { getHasTOTPEnabled, getHasTOTPSettingEnabled } from 'proton-shared/lib/settings/twoFactor';
import { InfoAuthedResponse, TwoFaResponse } from 'proton-shared/lib/authentication/interface';
import { getInfo } from 'proton-shared/lib/api/auth';

import { FormModal, Loader } from '../../components';
import { useApi, useUser, useUserSettings } from '../../hooks';
import PasswordTotpInputs from './PasswordTotpInputs';

interface Props {
    onClose?: () => void;
    onSubmit: (data: { password: string; totp: string }) => void;
    error: string;
    loading?: boolean;

    [key: string]: any;
}

const AskAuthModal = ({ onClose, onSubmit, error, loading, ...rest }: Props) => {
    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [{ isSubUser }] = useUser();
    const api = useApi();
    const [adminAuthTwoFA, setAdminAuthTwoFA] = useState<TwoFaResponse>();

    useEffect(() => {
        const run = async () => {
            /**
             * There is a special case for admins logged into non-private users. User settings returns two factor
             * information for the non-private user, and not for the admin to which the session actually belongs.
             * So we query auth info to get the information about the admin.
             */
            const infoResult = await api<InfoAuthedResponse>(getInfo());
            setAdminAuthTwoFA(infoResult['2FA']);
        };
        run();
    }, []);

    const hasTOTPEnabled = isSubUser
        ? getHasTOTPEnabled(adminAuthTwoFA?.Enabled)
        : getHasTOTPSettingEnabled(userSettings);

    const isLoading = loadingUserSettings || (isSubUser && !adminAuthTwoFA);

    return (
        <FormModal
            onClose={onClose}
            onSubmit={() => onSubmit({ password, totp })}
            title={c('Title').t`Sign in again to continue`}
            close={c('Label').t`Cancel`}
            submit={c('Label').t`Submit`}
            error={error}
            small
            loading={loading || isLoading}
            {...rest}
        >
            {isLoading ? (
                <Loader />
            ) : (
                <PasswordTotpInputs
                    password={password}
                    setPassword={setPassword}
                    passwordError={error}
                    totp={totp}
                    setTotp={setTotp}
                    totpError={error}
                    showTotp={hasTOTPEnabled}
                />
            )}
        </FormModal>
    );
};

export default AskAuthModal;
