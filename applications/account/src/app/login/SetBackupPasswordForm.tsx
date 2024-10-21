import { c } from 'ttag';

import { InputFieldTwo } from '@proton/components';
import type { AuthCacheResult, SSOSetupData } from '@proton/components/containers/login/interface';

import JoinOrganizationAdminItem from '../public/JoinOrganizationAdminItem';
import Text from '../public/Text';
import SetPasswordForm from './SetPasswordForm';

interface Props {
    onSubmit: (newPassword: string) => Promise<void>;
    ssoSetupData: SSOSetupData | null;
    userData: AuthCacheResult['data']['user'];
}

const SetBackupPasswordForm = ({ onSubmit, ssoSetupData, userData }: Props) => {
    const username = ssoSetupData?.unprivatizationContextData.addresses[0]?.Email || userData?.Email || userData?.Name;

    const organizationData = ssoSetupData?.organizationData;
    const organizationLogoUrl = organizationData?.organizationLogo?.url;
    const organizationName = organizationData?.organization.Name || '';
    const organizationIdentityAddress = organizationData?.organizationIdentity.FingerprintSignatureAddress || '';

    const parsedUnprivatizationData = ssoSetupData?.parsedUnprivatizationData;
    const adminEmail =
        parsedUnprivatizationData?.type === 'gsso'
            ? parsedUnprivatizationData.payload.unprivatizationData.AdminEmail
            : organizationIdentityAddress;

    return (
        <>
            <JoinOrganizationAdminItem
                adminEmail={adminEmail || ''}
                organizationLogoUrl={organizationLogoUrl}
                organizationName={organizationName}
            />
            <hr className="my-6 border-bottom border-weak" />
            <Text>
                {c('sso')
                    .t`Set a backup password to add an extra layer of protection. It will allow you to sign in if you get locked out, so make sure to keep it somewhere safe.`}
            </Text>
            <SetPasswordForm onSubmit={onSubmit} type="backup">
                <InputFieldTwo
                    id="username"
                    bigger
                    label={c('Info').t`Username`}
                    readOnly
                    value={username}
                    rootClassName="mb-2"
                />
            </SetPasswordForm>
        </>
    );
};

export default SetBackupPasswordForm;
