import React from 'react';
import { c } from 'ttag';
import {
    Alert,
    Block,
    PrimaryButton,
    LearnMore,
    useOrganization,
    useOrganizationKey,
    useModals
} from 'react-components';
import { getOrganizationKeyInfo } from './helpers/organizationKeysHelper';

import ReactivateOrganizationKeysModal from './ReactivateOrganizationKeysModal';

const RestoreAdministratorPrivileges = () => {
    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const { createModal } = useModals();

    const { isOrganizationKeyInactive } = getOrganizationKeyInfo(organizationKey);

    if (loadingOrganization || loadingOrganizationKey || !isOrganizationKeyInactive) {
        return null;
    }

    return (
        <Block>
            <Alert type="error">
                <div>
                    {c('Restore administrator panel')
                        .t`Due to a password change, your organization administrator privileges have been restricted. The following actions are no longer permitted:`}
                </div>
                <ul>
                    <li>{c('Restore administrator panel').t`Creating new sub-users`}</li>
                    <li>{c('Restore administrator panel').t`Reading emails of non-private subusers`}</li>
                    <li>{c('Restore administrator panel').t`Changing organization password`}</li>
                    <li>{c('Restore administrator panel').t`Changing organization keys`}</li>
                </ul>
            </Alert>
            <PrimaryButton
                className="mr1"
                onClick={() => createModal(<ReactivateOrganizationKeysModal mode="reactivate" />)}
            >
                {c('Action').t`Restore administrator privileges`}
            </PrimaryButton>
            <LearnMore url="https://protonmail.com/support/knowledge-base/business/">Learn more</LearnMore>
        </Block>
    );
};

export default RestoreAdministratorPrivileges;
