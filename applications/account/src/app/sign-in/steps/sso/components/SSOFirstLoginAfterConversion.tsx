import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

import JoinOrganizationAdminItem from '../../../../public/JoinOrganizationAdminItem';
import Text from '../../../../public/Text';
import type { JoinOrganization } from '../state-machine/joinOrganization';

interface Props {
    organization: JoinOrganization;
    onContinue: () => void;
}

/**
 * Intro to the first sign-in of a member converted to SSO. It confirms which organization moved
 * them, and continues to the backup password step to let them in with their previous password.
 */
const SSOFirstLoginAfterConversion = ({ organization, onContinue }: Props) => {
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
            <Button size="large" color="norm" fullWidth className="mt-6" onClick={onContinue}>
                {c('Action').t`Continue`}
            </Button>
        </>
    );
};

export default SSOFirstLoginAfterConversion;
