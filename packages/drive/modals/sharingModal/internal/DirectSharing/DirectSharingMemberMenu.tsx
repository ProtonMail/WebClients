import { NonProtonInvitationState } from '@protontech/drive-sdk';
import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import useLoading from '@proton/hooks/useLoading';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import { IcLink } from '@proton/icons/icons/IcLink';
import { IcPaperPlaneHorizontal } from '@proton/icons/icons/IcPaperPlaneHorizontal';

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
                            icon={IcPaperPlaneHorizontal}
                            onClick={() => withLoading(onResendInvitation)}
                        />
                    )}
                    {onCopyInvitationLink && (
                        <DropdownMenuItem
                            label={c('Action').t`Copy invite link`}
                            icon={IcLink}
                            onClick={onCopyInvitationLink}
                        />
                    )}
                    <DropdownMenuItem
                        label={c('Action').t`Remove access`}
                        icon={IcCrossBig}
                        onClick={() => withLoading(onRemoveAccess)}
                    />
                </DropdownMenu>
            </Dropdown>
        </>
    );
}
