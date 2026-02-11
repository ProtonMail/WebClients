import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Dropdown, DropdownButton, DropdownMenu } from '@proton/components';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { NonProtonInvitationState } from '@proton/drive';
import useLoading from '@proton/hooks/useLoading';

import { DropdownMenuItem } from '../DropdownMenuItem';
import type { DirectSharingRole } from '../interfaces';
import { DirectSharingRoles } from './helpers/DirectSharingRoles';
import { InvitationStateTranslations, MemberRoleTranslations } from './helpers/DirectSharingTranslations';

export function DirectSharingMemberMenu({
    disabled,
    selectedRole,
    onChangeRole,
    externalInvitationState,
    onResendInvitation,
    onCopyInvitationLink,
    onRemoveAccess,
}: {
    disabled: boolean;
    selectedRole: DirectSharingRole;
    onChangeRole: (role: DirectSharingRole) => void;
    externalInvitationState?: NonProtonInvitationState;
    onResendInvitation?: () => Promise<void>;
    onCopyInvitationLink?: () => void;
    onRemoveAccess: () => Promise<void>;
}) {
    const [isLoading, withLoading] = useLoading(false);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <Tooltip
                title={
                    externalInvitationState === NonProtonInvitationState.Pending
                        ? c('Tooltip').t`We have sent them an invite to access the item.`
                        : ''
                }
            >
                <DropdownButton
                    disabled={disabled}
                    className="self-center color-weak px-1"
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={toggle}
                    hasCaret
                    shape="ghost"
                    size="small"
                    loading={isLoading}
                >
                    {externalInvitationState
                        ? InvitationStateTranslations[externalInvitationState]
                        : MemberRoleTranslations[selectedRole]}
                </DropdownButton>
            </Tooltip>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    <DirectSharingRoles
                        onChangeRole={onChangeRole}
                        selectedRole={selectedRole}
                        externalInvitationState={externalInvitationState}
                    />
                    {onResendInvitation && (
                        <DropdownMenuItem
                            label={c('Action').t`Resend invite`}
                            iconName="paper-plane-horizontal"
                            onClick={() => withLoading(onResendInvitation)}
                        />
                    )}
                    {onCopyInvitationLink && (
                        <DropdownMenuItem
                            label={c('Action').t`Copy invite link`}
                            iconName="link"
                            onClick={onCopyInvitationLink}
                        />
                    )}
                    <DropdownMenuItem
                        label={c('Action').t`Remove access`}
                        iconName="cross-big"
                        onClick={() => withLoading(onRemoveAccess)}
                    />
                </DropdownMenu>
            </Dropdown>
        </>
    );
}
