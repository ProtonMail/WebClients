import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { AuthCacheResult, SSOSetupData } from '@proton/components/containers/login/interface';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText.tsx';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';

import JoinOrganizationAdminItem from '../public/JoinOrganizationAdminItem';
import Text from '../public/Text.tsx';
import { getJoinOrganizationData } from './joinOrganizationHelper';

interface Props {
    onSubmit: () => Promise<void>;
    ssoSetupData: SSOSetupData | null;
    userData: AuthCacheResult['data']['user'];
}

/**
 * First SSO login for organizations that disabled the backup password. There is nothing for the
 * member to set up, so it only confirms which organization they are joining.
 */
const SetupWithoutBackupPasswordForm = ({ onSubmit, ssoSetupData, userData }: Props) => {
    const [loading, withLoading] = useLoading();
    const { organizationLogoUrl, organizationName, adminEmail, username } = getJoinOrganizationData(
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
            <Text className="mt-6 text-center">
                {getBoldFormattedText(c('sso').t`Continue to join as **${username}**`)}
            </Text>
            <Button
                size="large"
                color="norm"
                fullWidth
                className="mt-6"
                loading={loading}
                onClick={() => withLoading(onSubmit()).catch(noop)}
            >
                {c('Action').t`Continue`}
            </Button>
        </>
    );
};

export default SetupWithoutBackupPasswordForm;
