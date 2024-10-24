import type { MutableRefObject } from 'react';
import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useMembers } from '@proton/account/members/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { getPrivatizeError } from '@proton/account/organizationKey/actions';
import { useOrganizationKey } from '@proton/account/organizationKey/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button, Href } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { MemberListBanner, MembersList } from '@proton/components/containers/organization/MemberListBanner';
import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Member } from '@proton/shared/lib/interfaces';
import {
    OrganizationKeyMode,
    OrganizationKeyState,
    getMemberHasAccessToOrgKey,
    getMemberHasMissingOrgKey,
    getNonPrivateMembers,
    getOrganizationKeyInfo,
} from '@proton/shared/lib/organization/helper';

import { useNotifications } from '../../hooks';
import ActivatePasswordlessOrganizationKey from './ActivatePasswordlessOrganizationKey';
import ChangeOrganizationKeysModal from './ChangeOrganizationKeysModal';
import ChangeOrganizationKeysPasswordlessModal from './ChangeOrganizationKeysPasswordlessModal';
import ChangeOrganizationPasswordModal from './ChangeOrganizationPasswordModal';
import InviteOrganizationKeysModal from './InviteOrganizationKeysModal';
import ReactivateOrganizationKeysModal from './ReactivateOrganizationKeysModal';
import ReactivatePasswordlessOrganizationKey from './ReactivatePasswordlessOrganizationKey';
import { getActivationText, getReactivationText } from './helper';

const UserNeedsToInvite = ({
    onRestorePrivilegesClick,
    otherAdminsWithMissingOrgKeys,
}: {
    onRestorePrivilegesClick: () => void;
    otherAdminsWithMissingOrgKeys: Member[];
}) => {
    const n = otherAdminsWithMissingOrgKeys.length;
    return (
        <MemberListBanner
            icon="info-circle"
            members={
                <>
                    <div>
                        {c('Restore administrator panel').ngettext(
                            msgid`${n} administrator in your organization need access to the organization key.`,
                            `${n} administrators in your organization need access to the organization key.`,
                            n
                        )}
                    </div>
                    <Href href={getKnowledgeBaseUrl('/restore-administrator')} className="inline-block">
                        {c('Link').t`Learn more`}
                    </Href>
                    <MembersList members={otherAdminsWithMissingOrgKeys} />
                </>
            }
            action={
                <Button size="small" color="norm" onClick={onRestorePrivilegesClick}>
                    {c('Title').t`Restore administrator privileges`}
                </Button>
            }
        />
    );
};

const UserNeedsToReactivatePasswordless = ({ onRestorePrivilegesClick }: { onRestorePrivilegesClick: () => void }) => {
    return (
        <MemberListBanner
            icon="info-circle"
            members={
                <>
                    <div>{getReactivationText()}</div>
                    <Href href={getKnowledgeBaseUrl('/restore-administrator')} className="inline-block">
                        {c('Link').t`Learn more`}
                    </Href>
                </>
            }
            action={
                <Button size="small" color="norm" onClick={onRestorePrivilegesClick}>
                    {c('Title').t`Restore administrator privileges`}
                </Button>
            }
        />
    );
};

const UserNeedsToReactivate = ({ onRestorePrivilegesClick }: { onRestorePrivilegesClick: () => void }) => {
    return (
        <MemberListBanner
            icon="info-circle"
            members={
                <>
                    <div>
                        {c('Restore administrator panel')
                            .t`Due to a password change, your organization administrator privileges have been restricted. The following actions are no longer permitted:`}
                    </div>
                    <ul className="mb-0">
                        <li>{c('Restore administrator panel').t`Creating or accessing non-private user accounts`}</li>
                        <li>{c('Restore administrator panel').t`Changing organization password`}</li>
                        <li>{c('Restore administrator panel').t`Changing organization keys`}</li>
                    </ul>
                    <Href href={getKnowledgeBaseUrl('/restore-administrator')} className="inline-block">
                        {c('Link').t`Learn more`}
                    </Href>
                </>
            }
            action={
                <Button size="small" color="norm" onClick={onRestorePrivilegesClick}>
                    {c('Title').t`Restore administrator privileges`}
                </Button>
            }
        />
    );
};

const UserNeedsToActivate = ({ onActiveOrganizationKeyClick }: { onActiveOrganizationKeyClick: () => void }) => {
    return (
        <MemberListBanner
            icon="info-circle"
            members={getActivationText()}
            action={
                <Button size="small" color="norm" onClick={onActiveOrganizationKeyClick}>
                    {c('Action').t`Activate organization key`}
                </Button>
            }
        />
    );
};

const useOrganizationModals = (onceRef: MutableRefObject<boolean>) => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey();
    const [addresses] = useAddresses();
    const [members, loadingMembers] = useMembers();
    const { createNotification } = useNotifications();
    const [reactivateModalProps, setReactivateModal, reactivateModalRender] = useModalState();
    const [reactivatePasswordlessModalProps, setReactivatePasswordlessModal, renderReactivatePasswordlessModal] =
        useModalState();
    const [activateModalProps, setActivateModal, renderActivateModal] = useModalState();
    const [activatePasswordlessModalProps, setActivatePasswordlessModal, renderActivatePasswordless] = useModalState();
    const [changeOrganizationKeysProps, setChangeOrganizationKeys, renderChangeOrganizationKeys] = useModalState();
    const [
        changePasswordlessOrganizationKeysProps,
        setChangePasswordlessOrganizationKeys,
        renderChangePasswordlessOrganizationKeys,
    ] = useModalState();
    const [
        invitePasswordlessOrganizationKeys,
        setInvitePasswordlessOrganizationKeys,
        renderInvitePasswordlessOrganizationKeys,
    ] = useModalState();
    const [changeOrganizationPasswordProps, setChangeOrganizationPassword, renderChangeOrganizationPassword] =
        useModalState();
    const [changeMode, setChangeMode] = useState<'reset' | undefined>();

    const organizationKeyInfo = getOrganizationKeyInfo(organization, organizationKey, addresses);
    const otherAdmins = (members || []).filter(
        (member) => member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN && !member.Self
    );
    const otherAdminsWithKeyAccess = otherAdmins.filter(getMemberHasAccessToOrgKey);
    const otherAdminsWithMissingOrgKey = otherAdmins.filter(getMemberHasMissingOrgKey);
    const hasOtherAdmins = otherAdmins.length > 0;
    const publicMembers = getNonPrivateMembers(members || []);

    const disableResetOrganizationKeys = publicMembers.length > 0 && !organizationKey?.privateKey;

    const handleChangeOrganizationKeys = (mode?: 'reset') => {
        if (!organizationKey) {
            throw new Error('Organization key not loaded');
        }
        if (disableResetOrganizationKeys) {
            return createNotification({
                text: getPrivatizeError(),
                type: 'error',
            });
        }
        setChangeMode(mode);
        if (organizationKeyInfo.mode === OrganizationKeyMode.Passwordless) {
            setChangePasswordlessOrganizationKeys(true);
        } else {
            setChangeOrganizationKeys(true);
        }
    };

    const handleResetOrganizationKeys = () => {
        handleChangeOrganizationKeys('reset');
    };

    const handleChangeOrganizationPassword = () => {
        if (!organizationKey?.privateKey) {
            return createNotification({ text: c('Error').t`Organization key is not decrypted`, type: 'error' });
        }

        setChangeOrganizationPassword(true);
    };

    const disabled =
        !organization ||
        loadingMembers ||
        loadingOrganizationKey ||
        !organizationKey ||
        !user.isAdmin ||
        !organization?.HasKeys;

    useEffect(() => {
        if (onceRef.current || disabled) {
            return;
        }

        if (organizationKeyInfo.mode === OrganizationKeyMode.Passwordless) {
            if (organizationKeyInfo.state === OrganizationKeyState.Activate) {
                setActivatePasswordlessModal(true);
                onceRef.current = true;
            } else if (organizationKeyInfo.state === OrganizationKeyState.Inactive) {
                setReactivatePasswordlessModal(true);
                onceRef.current = true;
            }
        } else {
            if (organizationKeyInfo.state === OrganizationKeyState.Activate) {
                setActivateModal(true);
                onceRef.current = true;
            } else if (organizationKeyInfo.state === OrganizationKeyState.Inactive) {
                setReactivateModal(true);
                onceRef.current = true;
            }
        }
    }, [disabled]);

    const modals = (
        <>
            {reactivateModalRender && (
                <ReactivateOrganizationKeysModal
                    mode="reactivate"
                    onResetKeys={handleResetOrganizationKeys}
                    {...reactivateModalProps}
                />
            )}
            {renderActivateModal && (
                <ReactivateOrganizationKeysModal
                    mode="activate"
                    onResetKeys={handleResetOrganizationKeys}
                    {...activateModalProps}
                />
            )}
            {renderActivatePasswordless && (
                <ActivatePasswordlessOrganizationKey
                    onResetKeys={handleResetOrganizationKeys}
                    {...activatePasswordlessModalProps}
                />
            )}
            {renderReactivatePasswordlessModal && (
                <ReactivatePasswordlessOrganizationKey
                    user={user}
                    onResetKeys={handleResetOrganizationKeys}
                    disableResetOrganizationKeys={disableResetOrganizationKeys}
                    otherAdminsWithKeyAccess={otherAdminsWithKeyAccess}
                    {...reactivatePasswordlessModalProps}
                />
            )}
            {renderChangeOrganizationKeys && organizationKey && (
                <ChangeOrganizationKeysModal
                    mode={changeMode}
                    hasOtherAdmins={hasOtherAdmins}
                    organizationKey={organizationKey}
                    {...changeOrganizationKeysProps}
                />
            )}
            {renderChangePasswordlessOrganizationKeys && (
                <ChangeOrganizationKeysPasswordlessModal
                    mode={changeMode}
                    {...changePasswordlessOrganizationKeysProps}
                />
            )}
            {renderInvitePasswordlessOrganizationKeys && (
                <InviteOrganizationKeysModal
                    members={otherAdminsWithMissingOrgKey}
                    {...invitePasswordlessOrganizationKeys}
                />
            )}
            {renderChangeOrganizationPassword && organizationKey?.privateKey && (
                <ChangeOrganizationPasswordModal
                    hasOtherAdmins={hasOtherAdmins}
                    organizationKey={organizationKey.privateKey}
                    {...changeOrganizationPasswordProps}
                />
            )}
        </>
    );

    const handleActivatePasswordless = () => {
        setActivatePasswordlessModal(true);
    };
    const handleReActivatePasswordless = () => {
        setReactivatePasswordlessModal(true);
    };

    const handleActivate = () => {
        if (organizationKeyInfo.mode === OrganizationKeyMode.Passwordless) {
            handleActivatePasswordless();
        } else {
            setActivateModal(true);
        }
    };
    const handleReactivate = () => {
        if (organizationKeyInfo.mode === OrganizationKeyMode.Passwordless) {
            handleReActivatePasswordless();
        } else {
            setActivateModal(true);
        }
    };

    const info = (() => {
        if (disabled || organizationKeyInfo.state === OrganizationKeyState.NoKey) {
            return null;
        }
        if (organizationKeyInfo.mode === OrganizationKeyMode.Passwordless) {
            if (organizationKeyInfo.state === OrganizationKeyState.Activate) {
                return <UserNeedsToActivate onActiveOrganizationKeyClick={handleActivatePasswordless} />;
            }
            if (organizationKeyInfo.state === OrganizationKeyState.Inactive) {
                return <UserNeedsToReactivatePasswordless onRestorePrivilegesClick={handleReActivatePasswordless} />;
            }
            if (otherAdminsWithMissingOrgKey.length) {
                return (
                    <UserNeedsToInvite
                        onRestorePrivilegesClick={() => {
                            setInvitePasswordlessOrganizationKeys(true);
                        }}
                        otherAdminsWithMissingOrgKeys={otherAdminsWithMissingOrgKey}
                    />
                );
            }
        } else {
            if (organizationKeyInfo.state === OrganizationKeyState.Activate) {
                return <UserNeedsToActivate onActiveOrganizationKeyClick={handleActivate} />;
            }
            if (organizationKeyInfo.state === OrganizationKeyState.Inactive) {
                return <UserNeedsToReactivate onRestorePrivilegesClick={handleReactivate} />;
            }
        }
    })();

    return {
        modals,
        info,
        handleChangeOrganizationPassword,
        handleChangeOrganizationKeys,
        handleResetOrganizationKeys,
        handleActivatePasswordless,
        handleActivate,
        handleReactivate,
    };
};

export default useOrganizationModals;
