import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import {
    getHasOtherAdmins,
    getNonPrivateMembers,
    getOrganizationKeyInfo,
} from '@proton/shared/lib/organization/helper';

import { Alert, Block, useModalState } from '../../components';
import { useMembers, useNotifications, useOrganization, useOrganizationKey } from '../../hooks';
import ChangeOrganizationKeysModal from './ChangeOrganizationKeysModal';
import ReactivateOrganizationKeysModal from './ReactivateOrganizationKeysModal';
import { getActivationText } from './helper';

const UserNeedsToReactivate = ({ onRestorePrivilegesClick }: { onRestorePrivilegesClick: () => void }) => {
    return (
        <Block>
            <Alert className="mb-4" type="error">
                <div>
                    {c('Restore administrator panel')
                        .t`Due to a password change, your organization administrator privileges have been restricted. The following actions are no longer permitted:`}
                </div>
                <ul className="mb-0">
                    <li>{c('Restore administrator panel').t`Creating or accessing non-private users`}</li>
                    <li>{c('Restore administrator panel').t`Changing organization password`}</li>
                    <li>{c('Restore administrator panel').t`Changing organization keys`}</li>
                </ul>
            </Alert>
            <Button color="norm" className="mr-4" onClick={onRestorePrivilegesClick}>
                {c('Action').t`Restore administrator privileges`}
            </Button>
            <Href href={getKnowledgeBaseUrl('/proton-for-business')} className="inline-block">
                {c('Link').t`Learn more`}
            </Href>
        </Block>
    );
};

const UserNeedsToActivate = ({ onActiveOrganizationKeyClick }: { onActiveOrganizationKeyClick: () => void }) => {
    return (
        <Block>
            <Alert className="mb-4" type="error">
                {getActivationText()}
            </Alert>
            <Button color="norm" onClick={onActiveOrganizationKeyClick}>
                {c('Action').t`Activate organization key`}
            </Button>
        </Block>
    );
};

const RestoreAdministratorPrivileges = () => {
    const [members, loadingMembers] = useMembers();
    const { createNotification } = useNotifications();

    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);

    const [
        reactivateOrganizationKeysModalProps,
        setReactivateOrganizationKeysModalOpen,
        renderReactivateOrganizationKeysModal,
    ] = useModalState();
    const [
        activateOrganizationKeysModalProps,
        setActivateOrganizationKeysModalOpen,
        renderActivateOrganizationKeysModal,
    ] = useModalState();
    const [changeOrganizationKeysModalProps, setChangeOrganizationKeysModalOpen, renderChangeOrganizationKeysModal] =
        useModalState();

    const organizationKeyInfo = getOrganizationKeyInfo(organization, organizationKey);

    const hasOtherAdmins = members ? getHasOtherAdmins(members) : false;
    const publicMembers = members ? getNonPrivateMembers(members) : [];

    const handleResetOrganizationKeys = () => {
        if (!organizationKey) {
            throw new Error('Organization key not loaded');
        }
        if (publicMembers.length > 0 && !organizationKey.privateKey) {
            return createNotification({
                text: c('Error').t`You must privatize all users before generating new organization keys`,
                type: 'error',
            });
        }
        setChangeOrganizationKeysModalOpen(true);
    };

    if (!organizationKey || loadingOrganization || loadingOrganizationKey || !organization?.HasKeys || loadingMembers) {
        return null;
    }

    return (
        <>
            {renderActivateOrganizationKeysModal && (
                <ReactivateOrganizationKeysModal
                    mode="activate"
                    onResetKeys={handleResetOrganizationKeys}
                    {...activateOrganizationKeysModalProps}
                />
            )}
            {renderReactivateOrganizationKeysModal && (
                <ReactivateOrganizationKeysModal
                    mode="reactivate"
                    onResetKeys={handleResetOrganizationKeys}
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
            {(() => {
                if (organizationKeyInfo.userNeedsToReactivateKey) {
                    return (
                        <UserNeedsToReactivate
                            onRestorePrivilegesClick={() => setReactivateOrganizationKeysModalOpen(true)}
                        />
                    );
                }
                if (organizationKeyInfo.userNeedsToActivateKey) {
                    return (
                        <UserNeedsToActivate
                            onActiveOrganizationKeyClick={() => setActivateOrganizationKeysModalOpen(true)}
                        />
                    );
                }
            })()}
        </>
    );
};

export default RestoreAdministratorPrivileges;
