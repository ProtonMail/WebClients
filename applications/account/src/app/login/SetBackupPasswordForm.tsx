import { c } from 'ttag';

import { InputFieldTwo } from '@proton/components';
import type { AuthCacheResult, SSOSetupData } from '@proton/components/containers/login/interface';

import JoinOrganizationAdminItem from '../public/JoinOrganizationAdminItem';
import Text from '../public/Text';
import SetPasswordWithPolicyForm from './SetPasswordWithPolicyForm';
import { getJoinOrganizationData } from './joinOrganizationHelper';

interface Props {
    onSubmit: (data: { password: string }) => Promise<void>;
    ssoSetupData: SSOSetupData | null;
    userData: AuthCacheResult['data']['user'];
}

const SetBackupPasswordForm = ({ onSubmit, ssoSetupData, userData }: Props) => {
    const { organizationLogoUrl, organizationName, adminEmail, passwordPolicies, username } = getJoinOrganizationData(
        ssoSetupData,
        userData
    );

    return (
        <>
            <JoinOrganizationAdminItem
                adminEmail={adminEmail}
                organizationLogoUrl={organizationLogoUrl}
                organizationName={organizationName}
            />
            <hr className="my-6 border-bottom border-weak" />
            <Text>
                {c('sso')
                    .t`Set a backup password to add an extra layer of protection. It will allow you to sign in if you get locked out, so make sure to keep it somewhere safe.`}
            </Text>
            <SetPasswordWithPolicyForm passwordPolicies={passwordPolicies} onSubmit={onSubmit} type="backup">
                <InputFieldTwo
                    id="username"
                    bigger
                    label={c('Info').t`Username`}
                    readOnly
                    value={username}
                    rootClassName="mb-2"
                />
            </SetPasswordWithPolicyForm>
        </>
    );
};

export default SetBackupPasswordForm;
