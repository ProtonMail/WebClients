import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { CachedOrganizationKey, Member } from '@proton/shared/lib/interfaces';
import {
    getHasOtherAdmins,
    getNonPrivateMembers,
    getOrganizationKeyInfo,
} from '@proton/shared/lib/organization/helper';

import { Alert, Block, useModalState } from '../../components';
import { useMembers, useOrganization, useOrganizationKey } from '../../hooks';
import ChangeOrganizationKeysModal from './ChangeOrganizationKeysModal';
import ReactivateOrganizationKeysModal from './ReactivateOrganizationKeysModal';
import { getActivationText } from './helper';

const UserNeedsToReactivate = ({
    members,
    organizationKey,
}: {
    members: Member[];
    organizationKey: CachedOrganizationKey;
}) => {
    const [
        reactivateOrganizationKeysModalProps,
        setReactivateOrganizationKeysModalOpen,
        renderReactivateOrganizationKeysModal,
    ] = useModalState();
    const [changeOrganizationKeysModalProps, setChangeOrganizationKeysModalOpen, renderChangeOrganizationKeysModal] =
        useModalState();

    const hasOtherAdmins = members ? getHasOtherAdmins(members) : false;
    const publicMembers = members ? getNonPrivateMembers(members) : [];

    return (
        <>
            {renderReactivateOrganizationKeysModal && (
                <ReactivateOrganizationKeysModal
                    mode="reactivate"
                    onResetKeys={() => setChangeOrganizationKeysModalOpen(true)}
                    {...reactivateOrganizationKeysModalProps}
                />
            )}
            {renderChangeOrganizationKeysModal && (
                <ChangeOrganizationKeysModal
                    mode="reset"
                    hasOtherAdmins={hasOtherAdmins}
                    organizationKey={organizationKey}
                    publicMembers={publicMembers}
                    {...changeOrganizationKeysModalProps}
                />
            )}
            <Block>
                <Alert className="mb-4" type="error">
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
                <Button color="norm" className="mr-4" onClick={() => setReactivateOrganizationKeysModalOpen(true)}>
                    {c('Action').t`Restore administrator privileges`}
                </Button>
                <Href href={getKnowledgeBaseUrl('/proton-for-business')} className="inline-block">
                    {c('Link').t`Learn more`}
                </Href>
            </Block>
        </>
    );
};

const UserNeedsToActivate = ({
    members,
    organizationKey,
}: {
    members: Member[];
    organizationKey: CachedOrganizationKey;
}) => {
    const [
        activateOrganizationKeysModalProps,
        setActivateOrganizationKeysModalOpen,
        renderActivateOrganizationKeysModal,
    ] = useModalState();
    const [changeOrganizationKeysModalProps, setChangeOrganizationKeysModalOpen, renderChangeOrganizationKeysModal] =
        useModalState();

    const hasOtherAdmins = members ? getHasOtherAdmins(members) : false;
    const publicMembers = members ? getNonPrivateMembers(members) : [];

    return (
        <>
            {renderActivateOrganizationKeysModal && (
                <ReactivateOrganizationKeysModal
                    mode="activate"
                    onResetKeys={() => setChangeOrganizationKeysModalOpen(true)}
                    {...activateOrganizationKeysModalProps}
                />
            )}
            {renderChangeOrganizationKeysModal && (
                <ChangeOrganizationKeysModal
                    mode="reset"
                    hasOtherAdmins={hasOtherAdmins}
                    organizationKey={organizationKey}
                    publicMembers={publicMembers}
                    {...changeOrganizationKeysModalProps}
                />
            )}
            <Block>
                <Alert className="mb-4" type="error">
                    {getActivationText()}
                </Alert>
                <Button
                    color="norm"
                    onClick={() => {
                        console.log('hey');
                        setActivateOrganizationKeysModalOpen(true);
                    }}
                >
                    {c('Action').t`Activate organization key`}
                </Button>
            </Block>
        </>
    );
};

const RestoreAdministratorPrivileges = () => {
    const [members, loadingMembers] = useMembers();

    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);

    const organizationKeyInfo = getOrganizationKeyInfo(organization, organizationKey);

    if (!organizationKey || loadingOrganization || loadingOrganizationKey || !organization?.HasKeys || loadingMembers) {
        return null;
    }

    if (organizationKeyInfo.userNeedsToReactivateKey) {
        return <UserNeedsToReactivate members={members} organizationKey={organizationKey} />;
    }

    if (organizationKeyInfo.userNeedsToActivateKey) {
        return <UserNeedsToActivate members={members} organizationKey={organizationKey} />;
    }

    return null;
};

export default RestoreAdministratorPrivileges;
