import type { MutableRefObject, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { getPrivatizeError } from '@proton/account/organizationKey/actions';
import { Button, Card, Href } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Member } from '@proton/shared/lib/interfaces';
import { getMemberEmailOrName } from '@proton/shared/lib/keys/memberHelper';
import {
    OrganizationKeyMode,
    OrganizationKeyState,
    getMemberHasAccessToOrgKey,
    getMemberHasMissingOrgKey,
    getNonPrivateMembers,
    getOrganizationKeyInfo,
} from '@proton/shared/lib/organization/helper';

import { useAddresses, useMembers, useNotifications, useOrganization, useOrganizationKey, useUser } from '../../hooks';
import ActivatePasswordlessOrganizationKey from './ActivatePasswordlessOrganizationKey';
import AdministratorList from './AdministratorList';
import ChangeOrganizationKeysModal from './ChangeOrganizationKeysModal';
import ChangeOrganizationKeysPasswordlessModal from './ChangeOrganizationKeysPasswordlessModal';
import ChangeOrganizationPasswordModal from './ChangeOrganizationPasswordModal';
import InviteOrganizationKeysModal from './InviteOrganizationKeysModal';
import ReactivateOrganizationKeysModal from './ReactivateOrganizationKeysModal';
import ReactivatePasswordlessOrganizationKey from './ReactivatePasswordlessOrganizationKey';
import { getActivationText, getReactivationText } from './helper';

const Wrap = ({ children }: { children: ReactNode }) => {
    return (
        <Card rounded className="mb-4">
            {children}
        </Card>
    );
};

const UserNeedsToInvite = ({
    onRestorePrivilegesClick,
    otherAdminsWithMissingOrgKeys,
}: {
    onRestorePrivilegesClick: () => void;
    otherAdminsWithMissingOrgKeys: Member[];
}) => {
    const n = otherAdminsWithMissingOrgKeys.length;
    return (
        <Wrap>
            <div className="mb-4">
                <div>
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
                    <div className="mt-4">
                        <AdministratorList
                            members={otherAdminsWithMissingOrgKeys.map((member) => ({
                                member,
                                email: getMemberEmailOrName(member),
                            }))}
                        />
                    </div>
                </div>
            </div>
            <Button color="norm" className="mr-4" onClick={onRestorePrivilegesClick}>
                {c('Title').t`Restore administrator privileges`}
            </Button>
        </Wrap>
    );
};

const UserNeedsToReactivatePasswordless = ({ onRestorePrivilegesClick }: { onRestorePrivilegesClick: () => void }) => {
    return (
        <Wrap>
            <div className="mb-4">
                <div className="mb-4">
                    <div>{getReactivationText()}</div>
                    <Href href={getKnowledgeBaseUrl('/restore-administrator')} className="inline-block">
                        {c('Link').t`Learn more`}
                    </Href>
                </div>
            </div>
            <Button color="norm" className="mr-4" onClick={onRestorePrivilegesClick}>
                {c('Title').t`Restore administrator privileges`}
            </Button>
        </Wrap>
    );
};

const UserNeedsToReactivate = ({ onRestorePrivilegesClick }: { onRestorePrivilegesClick: () => void }) => {
    return (
        <Wrap>
            <div className="mb-4">
                <div>
                    {c('Restore administrator panel')
                        .t`Due to a password change, your organization administrator privileges have been restricted. The following actions are no longer permitted:`}
                </div>
                <ul className="mb-0">
                    <li>{c('Restore administrator panel').t`Creating or accessing non-private users`}</li>
                    <li>{c('Restore administrator panel').t`Changing organization password`}</li>
                    <li>{c('Restore administrator panel').t`Changing organization keys`}</li>
                </ul>
            </div>
            <Button color="norm" className="mr-4" onClick={onRestorePrivilegesClick}>
                {c('Title').t`Restore administrator privileges`}
            </Button>
            <Href href={getKnowledgeBaseUrl('/restore-administrator')} className="inline-block">
                {c('Link').t`Learn more`}
            </Href>
        </Wrap>
    );
};

const UserNeedsToActivate = ({ onActiveOrganizationKeyClick }: { onActiveOrganizationKeyClick: () => void }) => {
    return (
        <Wrap>
            <div className="mb-4">{getActivationText()}</div>
            <Button color="norm" onClick={onActiveOrganizationKeyClick}>
                {c('Action').t`Activate organization key`}
            </Button>
        </Wrap>
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
