import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

import Text from '../../../../public/Text';
import type { SSODataTypes } from '../../../auth/interface';
import SSOConfirmationCode from './SSOConfirmationCode';

interface Props {
    ssoData: SSODataTypes | undefined;
    onUseBackupPassword?: () => void;
}

const SSOAdminDeviceConfirmation2 = ({ ssoData, onUseBackupPassword }: Props) => {
    const text = (() => {
        if (!ssoData || ssoData.type === 'setup' || ssoData.type === 'set-password') {
            return '';
        }

        const email = ssoData.address.Email;
        const adminEmail = ssoData.organizationData.identity.FingerprintSignatureAddress || '';

        return getBoldFormattedText(
            c('sso')
                .t`To make sure it's really you trying to sign-in, share the confirmation code with your administrator **${adminEmail}** so that they can approve the request for **${email}**.`
        );
    })();

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
