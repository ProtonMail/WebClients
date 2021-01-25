import React from 'react';
import { c } from 'ttag';
import { USER_ROLES } from 'proton-shared/lib/constants';
import { Alert, Block, Loader, PrimaryButton, Table, TableBody, TableHeader, TableRow } from '../../components';
import { useMembers, useModals, useNotifications, useOrganization, useOrganizationKey } from '../../hooks';

import ChangeOrganizationPasswordModal from './ChangeOrganizationPasswordModal';
import ChangeOrganizationKeysModal from './ChangeOrganizationKeysModal';
import ReactivateOrganizationKeysModal, { MODES } from './ReactivateOrganizationKeysModal';
import { getOrganizationKeyInfo } from './helpers/organizationKeysHelper';
import useDisplayOrganizationKey from './useDisplayOrganizationKey';

const OrganizationSection = () => {
    const [organization, loadingOrganization] = useOrganization();
    const [members, loadingMembers] = useMembers();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const displayOrganizationKey = useDisplayOrganizationKey(organizationKey);

    if (loadingOrganizationKey || loadingOrganization || loadingMembers) {
        return <Loader />;
    }

    // Organization is not setup.
    if (!organization.HasKeys) {
        return <Alert type="warning">{c('Info').t`Multi-user support not enabled.`}</Alert>;
    }

    const { hasOrganizationKey, isOrganizationKeyActive, isOrganizationKeyInactive } = getOrganizationKeyInfo(
        organizationKey
    );

    const hasOtherAdmins = members.some(({ Role, Self }) => Self !== 1 && Role === USER_ROLES.ADMIN_ROLE);

    const handleOpenOrganizationKeys = () => {
        const nonPrivateMembers = members.filter(({ Private }) => Private === 0);

        if (nonPrivateMembers.length > 0 && !isOrganizationKeyActive) {
            return createNotification({
                text: c('Error').t`You must privatize all sub-accounts before generating new organization keys`,
                type: 'error',
            });
        }

        if (!organizationKey?.privateKey) {
            return createNotification({ text: c('Error').t`Organization key is not decrypted.`, type: 'error' });
        }

        createModal(
            <ChangeOrganizationKeysModal
                hasOtherAdmins={hasOtherAdmins}
                organizationKey={organizationKey.privateKey}
                nonPrivateMembers={nonPrivateMembers}
            />
        );
    };

    const handleChangeOrganizationPassword = () => {
        if (!organizationKey?.privateKey) {
            return createNotification({ text: c('Error').t`Organization key is not decrypted.`, type: 'error' });
        }

        createModal(
            <ChangeOrganizationPasswordModal
                hasOtherAdmins={hasOtherAdmins}
                organizationKey={organizationKey.privateKey}
            />
        );
    };

    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/organization-key">{c('Info')
                .t`Your organization's emails are protected with end-to-end encryption using the organization key. This fingerprint can be used to verify that all administrators in your account have the same key.`}</Alert>
            <Block>
                {isOrganizationKeyActive && (
                    <>
                        <PrimaryButton onClick={handleChangeOrganizationPassword} className="mr1 mb0-5">
                            {c('Action').t`Change password`}
                        </PrimaryButton>
                        <PrimaryButton onClick={handleOpenOrganizationKeys} className="mr1 mb0-5">
                            {c('Action').t`Change organization keys`}
                        </PrimaryButton>
                    </>
                )}
                {isOrganizationKeyInactive && (
                    <>
                        <Alert type="error">
                            {c('Error')
                                .t`You have lost access to your organization keys. Without restoration you will not be able to create new users, add addresses to existing users, or access non-private user accounts.`}
                        </Alert>
                        <PrimaryButton
                            onClick={() => createModal(<ReactivateOrganizationKeysModal mode={MODES.REACTIVATE} />)}
                            className="mr1"
                        >
                            {c('Action').t`Restore administrator privileges`}
                        </PrimaryButton>
                    </>
                )}
                {!hasOrganizationKey && (
                    <>
                        <Alert type="error">
                            {c('Error')
                                .t`You must activate your organization keys. Without activation you will not be able to create new users, add addresses to existing users, or access non-private user accounts.`}
                        </Alert>
                        <PrimaryButton
                            onClick={() => createModal(<ReactivateOrganizationKeysModal mode={MODES.ACTIVATE} />)}
                            className="mr1"
                        >
                            {c('Action').t`Activate organization key`}
                        </PrimaryButton>
                    </>
                )}
            </Block>
            {hasOrganizationKey && (
                <Table>
                    <TableHeader cells={[c('Header').t`Organization key fingerprint`, c('Header').t`Key type`]} />
                    <TableBody colSpan={2}>
                        <TableRow
                            cells={[
                                <code key={1} className="mw100 inbl ellipsis">
                                    {displayOrganizationKey.fingerprint}
                                </code>,
                                displayOrganizationKey.algorithm,
                            ]}
                        />
                    </TableBody>
                </Table>
            )}
        </>
    );
};

export default OrganizationSection;
