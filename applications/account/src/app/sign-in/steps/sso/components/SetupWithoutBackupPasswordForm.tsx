import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText.tsx';

import JoinOrganizationAdminItem from '../../../../public/JoinOrganizationAdminItem';
import Text from '../../../../public/Text';
import type { JoinOrganization } from '../state-machine/joinOrganization';

interface Props {
    submitting: boolean;
    onSubmit: () => void;
    organization: JoinOrganization;
}

/**
 * First SSO login for organizations that disabled the backup password. There is nothing for the
 * member to set up, so it only confirms which organization they are joining.
 */
const SetupWithoutBackupPasswordForm = ({ submitting, onSubmit, organization }: Props) => {
    const { organizationLogoUrl, organizationName, adminEmail, username } = organization;

    return (
        <>
            <JoinOrganizationAdminItem
                adminEmail={adminEmail}
                organizationLogoUrl={organizationLogoUrl}
                organizationName={organizationName}
            />
            <Text className="mt-6 text-center">
                {getBoldFormattedText(c('sso').t`Continue to join as **${username}**`)}
            </Text>
            <Button
                size="large"
                color="norm"
                fullWidth
                className="mt-6"
                loading={submitting}
                onClick={() => onSubmit()}
            >
                {c('Action').t`Continue`}
            </Button>
        </>
    );
};

export default SetupWithoutBackupPasswordForm;
