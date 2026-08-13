import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { AuthCacheResult, SSODataTypes } from '@proton/components/containers/login/interface';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

import JoinOrganizationAdminItem from '../../public/JoinOrganizationAdminItem';
import Text from '../../public/Text';
import { getJoinOrganizationData } from '../joinOrganizationHelper';

interface Props {
    ssoData: SSODataTypes;
    userData: AuthCacheResult['data']['user'];
    onContinue: () => void;
}

/**
 * Intro to the first sign-in of a member converted to SSO. It confirms which organization moved
 * them, and continues to the backup password step to let them in with their previous password.
 */
const SSOFirstLoginAfterConversion = ({ ssoData, userData, onContinue }: Props) => {
    const { organizationLogoUrl, organizationName, adminEmail, username } = getJoinOrganizationData(ssoData, userData);

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
