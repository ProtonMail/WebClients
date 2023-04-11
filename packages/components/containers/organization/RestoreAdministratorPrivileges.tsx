import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { getOrganizationKeyInfo } from '@proton/shared/lib/organization/helper';

import { Alert, Block, LearnMore, SettingsLink } from '../../components';
import { useOrganization, useOrganizationKey } from '../../hooks';
import { getActivationText } from './helper';

const RestoreAdministratorPrivileges = () => {
    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);

    const organizationKeyInfo = getOrganizationKeyInfo(organization, organizationKey);

    if (loadingOrganization || loadingOrganizationKey || !organization?.HasKeys) {
        return null;
    }

    if (organizationKeyInfo.userNeedsToReactivateKey) {
        return (
            <Block>
                <Alert className="mb1" type="error">
                    <div>
                        {c('Restore administrator panel')
                            .t`Due to a password change, your organization administrator privileges have been restricted. The following actions are no longer permitted:`}
                    </div>
                    <ul className="mb-0">
                        <li>{c('Restore administrator panel').t`Creating new users`}</li>
                        <li>{c('Restore administrator panel').t`Reading emails of non-private users`}</li>
                        <li>{c('Restore administrator panel').t`Changing organization password`}</li>
                        <li>{c('Restore administrator panel').t`Changing organization keys`}</li>
                    </ul>
                </Alert>
                <ButtonLike as={SettingsLink} path="/organization-keys" color="norm" className="mr1">
                    {c('Action').t`Restore administrator privileges`}
                </ButtonLike>
                <LearnMore className="inline-block" url={getKnowledgeBaseUrl('/proton-for-business')} />
            </Block>
        );
    }

    if (organizationKeyInfo.userNeedsToActivateKey) {
        return (
            <Block>
                <Alert className="mb1" type="error">
                    {getActivationText()}
                </Alert>
                <ButtonLike as={SettingsLink} path="/organization-keys" color="norm">
                    {c('Action').t`Activate organization key`}
                </ButtonLike>
            </Block>
        );
    }

    return null;
};

export default RestoreAdministratorPrivileges;
