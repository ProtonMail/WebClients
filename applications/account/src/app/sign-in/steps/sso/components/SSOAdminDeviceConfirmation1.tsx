import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import OrganizationAdminItem from '../../../../public/OrganizationAdminItem';
import type { SSODataTypes } from '../../../auth/interface';

interface Props {
    submitting: boolean;
    ssoData: SSODataTypes | undefined;
    onUseBackupPassword?: () => void;
    onConfirmAskAdmin: () => void;
    /** The organization disabled the SSO backup password, see `getSSOIntent` */
    backupPasswordDisabled: boolean;
}

const SSOAdminDeviceConfirmation = ({
    submitting,
    onConfirmAskAdmin,
    onUseBackupPassword,
    ssoData,
    backupPasswordDisabled,
}: Props) => {
    const safeSsoData = ssoData && ssoData.type !== 'set-password' ? ssoData : null;
    const organizationData = safeSsoData?.organizationData;
    const organizationLogoUrl = organizationData?.logo?.url;
    const organizationIdentityAddress = organizationData?.identity.FingerprintSignatureAddress || '';

    return (
        <div>
            <OrganizationAdminItem
                adminEmail={organizationIdentityAddress}
                organizationLogoUrl={organizationLogoUrl}
                className="border border-weak p-3"
            />
            <div className="mt-4">
                {backupPasswordDisabled
                    ? c('sso').t`This will sign you out of your other devices.`
                    : c('sso')
                          .t`This will sign you out of your other devices and you will have to create a new backup password.`}
            </div>
            <Button
                loading={submitting}
                size="large"
                color="norm"
                type="button"
                fullWidth
                className="mt-6"
                onClick={() => {
                    onConfirmAskAdmin();
                }}
            >
                {c('sso').t`Contact administrator`}
            </Button>
            {onUseBackupPassword && (
                <Button
                    size="large"
                    shape="outline"
                    color="weak"
                    type="button"
                    fullWidth
                    className="mt-2"
                    onClick={onUseBackupPassword}
                >
                    {c('sso').t`Use backup password instead`}
                </Button>
            )}
        </div>
    );
};

export default SSOAdminDeviceConfirmation;
