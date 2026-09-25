import { c } from 'ttag';

import InputFieldTwo from '@proton/components/components/v2/field/InputField';

import SetPasswordWithPolicyForm from '../../../../components/password-forms/SetPasswordWithPolicyForm';
import JoinOrganizationAdminItem from '../../../../public/JoinOrganizationAdminItem';
import Text from '../../../../public/Text';
import type { JoinOrganization } from '../state-machine/joinOrganization';

interface Props {
    submitting: boolean;
    onSubmit: (data: { password: string }) => void;
    organization: JoinOrganization;
}

const SetBackupPasswordForm = ({ submitting, onSubmit, organization }: Props) => {
    const { organizationLogoUrl, organizationName, adminEmail, passwordPolicies, username } = organization;

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
            <SetPasswordWithPolicyForm
                passwordPolicies={passwordPolicies}
                onSubmit={onSubmit}
                submitting={submitting}
                type="backup"
            >
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
