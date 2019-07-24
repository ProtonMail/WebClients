import React from 'react';
import { c } from 'ttag';
import {
    Block,
    SubTitle,
    Alert,
    PrimaryButton,
    Loader,
    Table,
    TableRow,
    TableHeader,
    TableBody,
    useMembers,
    useNotifications,
    useModals,
    useOrganization,
    useOrganizationKey
} from 'react-components';
import { USER_ROLES } from 'proton-shared/lib/constants';

import ChangeOrganizationPasswordModal from './ChangeOrganizationPasswordModal';
import ChangeOrganizationKeysModal from './ChangeOrganizationKeysModal';
import ReactivateOrganizationKeysModal from './ReactivateOrganizationKeysModal';
import { describe } from 'proton-shared/lib/keys/keysAlgorithm';
import { getOrganizationKeyInfo } from './helpers/organizationKeysHelper';

const OrganizationSection = () => {
    const [organization, loadingOrganization] = useOrganization();
    const [members, loadingMembers] = useMembers();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);

    const title = <SubTitle>{c('Title').t`Password & key`}</SubTitle>;

    if (loadingOrganizationKey || loadingOrganization || loadingMembers) {
        return (
            <>
                {title}
                <Loader />
            </>
        );
    }

    // Organization is not setup.
    if (!organization.HasKeys) {
        return (
            <>
                {title}
                <Alert type="warning">{c('Info').t`Multi-user support not enabled.`}</Alert>
            </>
        );
    }

    const { hasOrganizationKey, isOrganizationKeyActive, isOrganizationKeyInactive } = getOrganizationKeyInfo(
        organizationKey
    );

    const hasOtherAdmins = members.some(({ Role, Self }) => Self !== 1 && Role === USER_ROLES.ADMIN_ROLE);

    const handleOpenOrganizationKeys = () => {
        const nonPrivateMembers = members.filter(({ Private }) => Private === 0);

        if (nonPrivateMembers.length > 0 && !isOrganizationKeyActive) {
            return createNotification(
                c('Error').t`You must privatize all sub-accounts before generating new organization keys`
            );
        }

        createModal(
            <ChangeOrganizationKeysModal
                hasOtherAdmins={hasOtherAdmins}
                organizationKey={organizationKey}
                nonPrivateMembers={nonPrivateMembers}
            />
        );
    };

    return (
        <>
            {title}
            <Alert learnMore="https://protonmail.com/support/knowledge-base/organization-key">{c('Info')
                .t`Your organization's emails are protected with end-to-end encryption using the organization key. This fingerprint can be used to verify that all administrators in your account have the same key.`}</Alert>
            <Block>
                {isOrganizationKeyActive && (
                    <>
                        <PrimaryButton
                            onClick={() =>
                                createModal(
                                    <ChangeOrganizationPasswordModal
                                        hasOtherAdmins={hasOtherAdmins}
                                        organizationKey={organizationKey}
                                    />
                                )
                            }
                            className="mr1"
                        >
                            {c('Action').t`Change password`}
                        </PrimaryButton>
                        <PrimaryButton onClick={handleOpenOrganizationKeys} className="mr1">
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
                            onClick={() => createModal(<ReactivateOrganizationKeysModal mode="reactivate" />)}
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
                            onClick={() => createModal(<ReactivateOrganizationKeysModal mode="activate" />)}
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
                                    {organizationKey.getFingerprint()}
                                </code>,
                                describe(organizationKey.getAlgorithmInfo())
                            ]}
                        />
                    </TableBody>
                </Table>
            )}
        </>
    );
};

export default OrganizationSection;
