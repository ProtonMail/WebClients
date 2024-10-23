import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { AuthCacheResult } from '@proton/components/containers/login/interface';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

import Text from '../../public/Text';
import SSOConfirmationCode from './SSOConfirmationCode';

interface Props {
    ssoData: AuthCacheResult['data']['ssoData'];
    onUseBackupPassword?: () => void;
}

const SSOAdminDeviceConfirmation2 = ({ ssoData, onUseBackupPassword }: Props) => {
    const text = (() => {
        if (!ssoData || ssoData.type === 'setup' || ssoData.type === 'set-password') {
            return '';
        }

        const email = ssoData.address.Email;
        const adminEmail = ssoData.organizationData.organizationIdentity.FingerprintSignatureAddress || '';

        return getBoldFormattedText(
            c('sso')
                .t`To make sure it's really you trying to sign-in, share the confirmation code with your administrator **${adminEmail}** so that they can approve the request for **${email}**.`
        );
    })();

    useEffect(() => {
        if (!ssoData || (ssoData.type !== 'unlock' && ssoData.type !== 'inactive')) {
            return;
        }
        const stopPolling = ssoData.poll.start();
        return () => {
            stopPolling();
        };
    }, []);

    return (
        <div>
            <Text>{text}</Text>
            <SSOConfirmationCode ssoData={ssoData} />
            {onUseBackupPassword && (
                <Button
                    size="large"
                    shape="outline"
                    color="weak"
                    type="button"
                    fullWidth
                    className="mt-6"
                    onClick={onUseBackupPassword}
                >
                    {c('sso').t`Use backup password instead`}
                </Button>
            )}
        </div>
    );
};

export default SSOAdminDeviceConfirmation2;
