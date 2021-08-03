import { c } from 'ttag';
import { USER_ROLES } from '@proton/shared/lib/constants';
import { Alert, Block, Button, Loader, Table, TableBody, TableHeader, TableRow } from '../../components';
import { useMembers, useModals, useNotifications, useOrganization, useOrganizationKey } from '../../hooks';

import ChangeOrganizationPasswordModal from './ChangeOrganizationPasswordModal';
import ChangeOrganizationKeysModal from './ChangeOrganizationKeysModal';
import ReactivateOrganizationKeysModal, { MODES } from './ReactivateOrganizationKeysModal';
import { getOrganizationKeyInfo } from './helpers/organizationKeysHelper';
import useDisplayOrganizationKey from './useDisplayOrganizationKey';
import { SettingsParagraph, SettingsSection } from '../account';

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

    const { hasOrganizationKey, isOrganizationKeyActive, isOrganizationKeyInactive } =
        getOrganizationKeyInfo(organizationKey);

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
        <SettingsSection>
            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/organization-key">
                {c('Info')
                    .t`Your organization's emails are protected with end-to-end encryption using the organization key. This fingerprint can be used to verify that all administrators in your account have the same key.`}
            </SettingsParagraph>
            <Block>
                {isOrganizationKeyActive && (
                    <>
                        <Button color="norm" onClick={handleChangeOrganizationPassword} className="mr1 mb0-5">
                            {c('Action').t`Change password`}
                        </Button>
                        <Button color="norm" onClick={handleOpenOrganizationKeys} className="mr1 mb0-5">
                            {c('Action').t`Change organization keys`}
                        </Button>
                    </>
                )}
                {isOrganizationKeyInactive && (
                    <>
                        <Alert type="error">
                            {c('Error')
                                .t`You have lost access to your organization keys. Without restoration you will not be able to create new users, add addresses to existing users, or access non-private user accounts.`}
                        </Alert>
                        <Button
                            color="norm"
                            onClick={() => createModal(<ReactivateOrganizationKeysModal mode={MODES.REACTIVATE} />)}
                            className="mr1"
                        >
                            {c('Action').t`Restore administrator privileges`}
                        </Button>
                    </>
                )}
                {!hasOrganizationKey && (
                    <>
                        <Alert type="error">
                            {c('Error')
                                .t`You must activate your organization keys. Without activation you will not be able to create new users, add addresses to existing users, or access non-private user accounts.`}
                        </Alert>
                        <Button
                            color="norm"
                            onClick={() => createModal(<ReactivateOrganizationKeysModal mode={MODES.ACTIVATE} />)}
                            className="mr1"
                        >
                            {c('Action').t`Activate organization key`}
                        </Button>
                    </>
                )}
            </Block>
            {hasOrganizationKey && (
                <Table>
                    <TableHeader cells={[c('Header').t`Organization key fingerprint`, c('Header').t`Key type`]} />
                    <TableBody colSpan={2}>
                        <TableRow
                            cells={[
                                <code key={1} className="max-w100 block text-ellipsis">
                                    {displayOrganizationKey.fingerprint}
                                </code>,
                                displayOrganizationKey.algorithm,
                            ]}
                        />
                    </TableBody>
                </Table>
            )}
        </SettingsSection>
    );
};

export default OrganizationSection;
