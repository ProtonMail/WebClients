import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { AuthCacheResult } from '@proton/components/containers/login/interface';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';

import OrganizationAdminItem from '../../public/OrganizationAdminItem';

interface Props {
    ssoData: AuthCacheResult['data']['ssoData'];
    onUseBackupPassword?: () => void;
    onConfirmAskAdmin: () => Promise<void>;
}

const SSOAdminDeviceConfirmation = ({ onConfirmAskAdmin, onUseBackupPassword, ssoData }: Props) => {
    const [loading, withLoading] = useLoading();
    const safeSsoData = ssoData && ssoData.type !== 'set-password' ? ssoData : null;
    const organizationData = safeSsoData?.organizationData;
    const organizationLogoUrl = organizationData?.organizationLogo?.url;
    const organizationIdentityAddress = organizationData?.organizationIdentity.FingerprintSignatureAddress || '';

    return (
        <div>
            <OrganizationAdminItem
                adminEmail={organizationIdentityAddress}
                organizationLogoUrl={organizationLogoUrl}
                className="border border-weak p-3"
            />
            <div className="mt-4">
                {c('sso')
                    .t`This will sign you out of your other devices and you will have to create a new backup password.`}
            </div>
            <Button
                loading={loading}
                size="large"
                color="norm"
                type="button"
                fullWidth
                className="mt-6"
                onClick={() => {
                    withLoading(onConfirmAskAdmin()).catch(noop);
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
