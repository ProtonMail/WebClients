import { useEffect, MutableRefObject } from 'react';
import { c } from 'ttag';
import {
    getHasOtherAdmins,
    getNonPrivateMembers,
    getOrganizationKeyInfo,
} from '@proton/shared/lib/organization/helper';
import { Organization } from '@proton/shared/lib/interfaces';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Alert, Block, Button, Loader, Table, TableBody, TableHeader, TableRow } from '../../components';
import { useMembers, useModals, useNotifications, useOrganizationKey, useUser } from '../../hooks';
import { SettingsParagraph, SettingsSection } from '../account';

import useDisplayOrganizationKey from './useDisplayOrganizationKey';
import ChangeOrganizationKeysModal from './ChangeOrganizationKeysModal';
import ReactivateOrganizationKeysModal from './ReactivateOrganizationKeysModal';
import ChangeOrganizationPasswordModal from './ChangeOrganizationPasswordModal';
import { getActivationText } from './helper';

interface Props {
    organization?: Organization;
    onceRef: MutableRefObject<boolean>;
}

const OrganizationPasswordSection = ({ organization, onceRef }: Props) => {
    const [user] = useUser();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const organizationKeyInfo = getOrganizationKeyInfo(organization, organizationKey);
    const displayOrganizationKey = useDisplayOrganizationKey(organizationKey);
    const [members, loadingMembers] = useMembers();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();

    const hasOtherAdmins = members ? getHasOtherAdmins(members) : false;
    const publicMembers = members ? getNonPrivateMembers(members) : [];

    const handleChangeOrganizationKeys = (mode?: 'reset') => {
        if (!organizationKey) {
            throw new Error('Organization key not loaded');
        }
        if (publicMembers.length > 0 && !organizationKey.privateKey) {
            return createNotification({
                text: c('Error').t`You must privatize all users before generating new organization keys`,
                type: 'error',
            });
        }

        createModal(
            <ChangeOrganizationKeysModal
                mode={mode}
                hasOtherAdmins={hasOtherAdmins}
                organizationKey={organizationKey}
                publicMembers={publicMembers}
            />
        );
    };

    const handleResetOrganizationKeys = () => {
        handleChangeOrganizationKeys('reset');
    };

    const handleReactivateOrganizationKeys = () => {
        createModal(<ReactivateOrganizationKeysModal mode="reactivate" onResetKeys={handleResetOrganizationKeys} />);
    };

    const handleActivateOrganizationKeys = () => {
        createModal(<ReactivateOrganizationKeysModal mode="activate" onResetKeys={handleResetOrganizationKeys} />);
    };

    const handleChangeOrganizationPassword = () => {
        if (!organizationKey?.privateKey) {
            return createNotification({ text: c('Error').t`Organization key is not decrypted`, type: 'error' });
        }

        createModal(
            <ChangeOrganizationPasswordModal
                hasOtherAdmins={hasOtherAdmins}
                organizationKey={organizationKey.privateKey}
            />
        );
    };

    const loading = !organization || loadingMembers || loadingOrganizationKey;

    useEffect(() => {
        if (onceRef.current || loading || !organizationKey || !user.isAdmin || !organization?.HasKeys) {
            return;
        }

        const organizationKeyInfo = getOrganizationKeyInfo(organization, organizationKey);

        if (organizationKeyInfo.userNeedsToActivateKey) {
            handleActivateOrganizationKeys();
            onceRef.current = true;
        } else if (organizationKeyInfo.userNeedsToReactivateKey) {
            handleReactivateOrganizationKeys();
            onceRef.current = true;
        }
    }, [organization, organizationKey, user, loadingMembers]);

    if (loading) {
        return <Loader />;
    }

    // Organization is not setup.
    if (!organization?.HasKeys) {
        return <Alert className="mb1" type="warning">{c('Info').t`Multi-user support not enabled.`}</Alert>;
    }

    return (
        <SettingsSection>
            <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/organization-key')}>
                {c('Info')
                    .t`Your organization's emails are protected with end-to-end encryption using the organization key. This fingerprint can be used to verify that all administrators in your account have the same key.`}
            </SettingsParagraph>
            <Block>
                {organizationKey?.privateKey && (
                    <>
                        <Button color="norm" onClick={handleChangeOrganizationPassword} className="mr1">
                            {c('Action').t`Change password`}
                        </Button>
                        <Button onClick={() => handleChangeOrganizationKeys()}>
                            {c('Action').t`Change organization keys`}
                        </Button>
                    </>
                )}
                {organizationKeyInfo.userNeedsToReactivateKey && (
                    <>
                        <Alert className="mb1" type="error">
                            {c('Error')
                                .t`You have lost access to your organization keys. Without restoration you will not be able to create new users, add addresses to existing users, or access non-private user accounts.`}
                        </Alert>
                        <Button onClick={handleResetOrganizationKeys} className="mr1">
                            {c('Action').t`Reset organization keys`}
                        </Button>
                        <Button color="norm" onClick={handleReactivateOrganizationKeys} className="mr1">
                            {c('Action').t`Restore administrator privileges`}
                        </Button>
                    </>
                )}
                {organizationKeyInfo.userNeedsToActivateKey && (
                    <>
                        <Alert className="mb1" type="error">
                            {getActivationText()}
                        </Alert>
                        <Button color="norm" onClick={handleActivateOrganizationKeys} className="mr1">
                            {c('Action').t`Activate organization key`}
                        </Button>
                        <Button onClick={handleResetOrganizationKeys} className="mr1">
                            {c('Action').t`Reset organization keys`}
                        </Button>
                    </>
                )}
            </Block>
            {displayOrganizationKey.fingerprint && (
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

export default OrganizationPasswordSection;
