import type { MouseEvent } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import {
    ContactEmailsProvider,
    FileIcon,
    type ModalStateProps,
    ModalTwo,
    useConfirmActionModal,
    useToggle,
} from '@proton/components';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { MemberRole, type ShareNodeSettings } from '@proton/drive';
import useLoading from '@proton/hooks/useLoading';
import { IcCogWheel } from '@proton/icons/icons/IcCogWheel';
import { IcLockFilled } from '@proton/icons/icons/IcLockFilled';

import ModalContentLoader from '../../components/modals/ModalContentLoader';
import { useFlagsDriveDirectSharing } from '../../flags/useFlagsDriveDirectSharing';
import { useFlagsDrivePublicSharing } from '../../flags/useFlagsDrivePublicSharing';
import { DirectSharingAutocomplete } from './DirectSharing/DirectSharingAutocomplete';
import { DirectSharingFooter } from './DirectSharing/DirectSharingFooter';
import { DirectSharingInviteMessage } from './DirectSharing/DirectSharingInviteMessage';
import { DirectSharingListing } from './DirectSharing/DirectSharingListing';
import { useShareInvitees } from './DirectSharing/useShareInvitees';
import ErrorState from './ErrorState';
import { PublicSharing } from './PublicSharing/PublicSharing';
import { useSharingSettingsModal } from './SharingSettingsModal';
import type { DirectMember, DirectSharingRole } from './interfaces';
import { EditorsManageAccessContextProvider } from './useEditorsManageAccess';

import './SharingModalView.scss';

export interface SharingModalViewProps extends ModalStateProps {
    isLoading: boolean;

    nodeUid: string;
    roleOnParentNode?: MemberRole;
    fileName: string;
    showPermissionsCheckbox: boolean;
    mediaType?: string;
    ownerEmail?: string;
    ownerDisplayName?: string;
    directMembers: DirectMember[];
    existingEmails: string[];
    sharingInfo: any;

    errorMessage?: string;
    loadingMessage?: string;

    isShared: boolean;

    isPublicLinkEnabled: boolean;
    publicLink?: {
        role: MemberRole;
        url: string;
        customPassword?: string;
        expirationTime?: Date;
    };

    actions: {
        unshareNode: (email: string, options?: { refreshSharedWithMe?: boolean }) => Promise<void>;
        unsharePublic: () => Promise<void>;
        resendInvitation: (invitationUid: string) => Promise<void>;
        createSharePublic: () => Promise<void>;
        updateShareDirect: (directShareSettings: Omit<ShareNodeSettings, 'publicLink'>) => Promise<void>;
        updateSharePublic: (publicLinkSettings: {
            role?: MemberRole;
            customPassword?: string;
            expiration?: Date;
        }) => Promise<void>;
        copyInvitationLink: (invitationUid: string, email: string) => void;
        onPublicLinkToggle?: (enabled: boolean) => void;
        stopSharing: () => Promise<void>;
    };
}

export const SharingModalView = ({
    onClose,
    onExit,
    open,
    isLoading,
    nodeUid,
    roleOnParentNode,
    fileName,
    showPermissionsCheckbox,
    mediaType,
    ownerEmail,
    ownerDisplayName,
    directMembers,
    existingEmails,
    sharingInfo,
    isPublicLinkEnabled,
    publicLink,
    errorMessage,
    loadingMessage,
    actions,
    isShared,
}: SharingModalViewProps) => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;

    const [addresses] = useAddresses();

    const { isDirectSharingDisabled } = useFlagsDriveDirectSharing();
    const { isPublicEditModeEnabled } = useFlagsDrivePublicSharing();

    const [settingsModal, showSettingsModal] = useSharingSettingsModal();
    const [confirmModal, showConfirmRemoveYourself] = useConfirmActionModal();

    const [publicLinkUpdating, withPublicLinkUpdating] = useLoading();
    const [publicLinkStateChanging, withPublicLinkStateChanging] = useLoading();

    const [selectedRole, setRole] = useState<DirectSharingRole>(MemberRole.Editor);
    const [inviteMessage, setInviteMessage] = useState('');
    const {
        state: includeInviteMessage,
        toggle: toggleIncludeInviteMessage,
        set: setIncludeInviteMessage,
    } = useToggle(true);
    const [isAdding, withAdding] = useLoading();

    const { invitees, add: addInvitee, remove: removeInvitee, clean: cleanInvitees } = useShareInvitees(existingEmails);

    const isInvitationWorkflow = !!invitees.length;
    const isSubmitDisabled = useMemo(
        () => !invitees.length || !!invitees.find((invitee) => invitee.isLoading || invitee.error),
        [invitees]
    );
    const isSettingsDisabled = publicLinkStateChanging || publicLinkUpdating || !(Boolean(publicLink?.url) || isShared);
    const isShareWithAnyoneLoading = publicLinkStateChanging || isLoading;
    const isClosedButtonDisabled = publicLinkStateChanging || publicLinkUpdating || isAdding;

    const cleanFields = () => {
        setInviteMessage('');
        setIncludeInviteMessage(true);
        cleanInvitees();
    };

    const handleSubmitDirectSharing = (e: MouseEvent) =>
        withAdding(async () => {
            e.preventDefault();
            await actions.updateShareDirect({
                users: invitees.map((invitee) => ({
                    email: invitee.email,
                    role: selectedRole,
                })),
                emailOptions: {
                    message: inviteMessage,
                    includeNodeName: includeInviteMessage,
                },
            });
        });

    const handleChangeRole = async (email: string, role: MemberRole) => {
        // NB in this case (editors can share) the editor role doesn't exist - internally, all editors are promoted to admins
        const demotingMyself = !!addresses?.find((address) => address.Email === email) && role === MemberRole.Viewer;
        // Only users without access to the parent or without admin on parent will loose sharing privileges
        if (demotingMyself && roleOnParentNode !== MemberRole.Admin) {
            showConfirmRemoveYourself({
                title: c('Title').t`Change access to viewer?`,
                submitText: c('Action').t`Change my access`,
                message: c('Info')
                    .t`You won’t be able to share "${fileName}" after changing access to viewer. Only the owner can change your access again.`,
                onSubmit: async () => {
                    await actions.updateShareDirect({
                        users: [{ email, role }],
                    });
                    onClose();
                },
            });
        } else {
            await actions.updateShareDirect({
                users: [{ email, role }],
            });
        }
    };

    const handleUpdatePublicLink = (publicLinkSettings: {
        role?: MemberRole;
        customPassword?: string;
        expiration?: Date;
    }) => {
        return withPublicLinkUpdating(actions.updateSharePublic(publicLinkSettings));
    };

    const handleCreatePublicLink = () => {
        return withPublicLinkStateChanging(actions.createSharePublic());
    };

    const handleDeletePublicLink = () => {
        return withPublicLinkStateChanging(actions.unsharePublic());
    };

    const handleCancel = () => {
        cleanFields();
    };

    const handleRemove = async (email: string) => {
        const removingMyself = !!addresses?.find((address) => address.Email === email);
        if (removingMyself && !roleOnParentNode) {
            showConfirmRemoveYourself({
                title: c('Title').t`Remove your access?`,
                submitText: c('Action').t`Remove my access`,
                message: c('Info')
                    .t`If you remove yourself, you’ll lose access to "${fileName}" and won’t be able to open it again unless the owner shares it with you.`,
                onSubmit: async () => {
                    await actions.unshareNode(email, { refreshSharedWithMe: true });
                    onClose();
                },
            });
        } else {
            await actions.unshareNode(email);
        }
    };

    const renderModalContent = () => {
        if (errorMessage) {
            return <ErrorState onClose={onClose}>{errorMessage}</ErrorState>;
        }

        if (loadingMessage) {
            return <ModalContentLoader>{loadingMessage}</ModalContentLoader>;
        }

        return (
            <ContactEmailsProvider>
                <div className="flex items-center justify-space-between flex-nowrap border-bottom border-weak px-8 py-3 mb-5">
                    <div className="flex items-center flex-nowrap gap-2 m-0" data-testid="modal-two-header">
                        <FileIcon mimeType={mediaType ?? ''} />
                        <span className="modal-two-header-title h4 text-bold text-ellipsis">{c('Title')
                            .t`Share "${fileName}"`}</span>
                    </div>

                    <div className="grow-0 shrink-0">
                        {!isInvitationWorkflow && (
                            <Tooltip
                                disabled={isSettingsDisabled}
                                title={
                                    <>
                                        <strong>{c('Tooltip').t`New!`}</strong>{' '}
                                        {c('Tooltip').t`Change shared item settings`}
                                    </>
                                }
                            >
                                <Button
                                    icon
                                    shape="ghost"
                                    onClick={() =>
                                        showSettingsModal({
                                            sharedFileName: fileName,
                                            stopSharing: async () => {
                                                await actions.stopSharing();
                                                onClose();
                                            },
                                            showPermissionsCheckbox,
                                        })
                                    }
                                    data-testid="share-modal-settings"
                                >
                                    <IcCogWheel />
                                </Button>
                            </Tooltip>
                        )}

                        <ModalHeaderCloseButton buttonProps={{ disabled: isClosedButtonDisabled }} />
                    </div>
                </div>

                <div className="px-8">
                    <DirectSharingAutocomplete
                        disabled={isDirectSharingDisabled}
                        existingEmails={existingEmails}
                        invitees={invitees}
                        onAdd={addInvitee}
                        onRemove={removeInvitee}
                        onChangeRole={setRole}
                        selectedRole={selectedRole}
                    />

                    {!isInvitationWorkflow ? (
                        <>
                            <p className="color-weak my-4">{c('Info').t`Who has access`}</p>
                            <DirectSharingListing
                                viewOnly={isDirectSharingDisabled}
                                isLoading={isLoading}
                                ownerEmail={ownerEmail}
                                ownerDisplayName={ownerDisplayName}
                                members={directMembers}
                                onRemove={handleRemove}
                                onChangeRole={handleChangeRole}
                                onResendInvitation={actions.resendInvitation}
                                onCopyInvitationLink={actions.copyInvitationLink}
                            />
                        </>
                    ) : (
                        <>
                            <DirectSharingInviteMessage
                                isAdding={isAdding}
                                inviteMessage={inviteMessage}
                                includeInviteMessage={includeInviteMessage}
                                onChangeInviteMessage={setInviteMessage}
                                onToggleIncludeInviteMessage={toggleIncludeInviteMessage}
                            />
                            <DirectSharingFooter
                                onSubmit={handleSubmitDirectSharing}
                                onCancel={handleCancel}
                                disabled={isSubmitDisabled}
                                loading={isAdding}
                                cleanFields={cleanFields}
                            />
                        </>
                    )}
                </div>
            </ContactEmailsProvider>
        );
    };

    return (
        <EditorsManageAccessContextProvider nodeUid={nodeUid} sharingInfo={sharingInfo}>
            <ModalTwo
                className="double-modal"
                size="large"
                open={open}
                onClose={onClose}
                onExit={onExit}
                onReset={(e: any) => {
                    e.preventDefault();
                    onClose();
                }}
                disableCloseOnEscape={publicLinkStateChanging || publicLinkUpdating || isAdding}
            >
                <div className="double-modal-content shadow-lifted mb-3">{renderModalContent()}</div>

                {!isInvitationWorkflow && isPublicLinkEnabled && (
                    <div className="double-modal-content shadow-lifted shrink-0">
                        <PublicSharing
                            publicLink={publicLink}
                            viewOnly={!isPublicEditModeEnabled}
                            onCreate={handleCreatePublicLink}
                            isLoading={isShareWithAnyoneLoading}
                            onUpdate={handleUpdatePublicLink}
                            onDelete={handleDeletePublicLink}
                            onToggle={actions.onPublicLinkToggle}
                            disabledToggle={publicLinkUpdating}
                        />
                    </div>
                )}

                <div className="flex items-center justify-center gap-2 pt-5 shrink-0">
                    <IcLockFilled color="white" />
                    <span className={isDarkTheme ? 'color-norm' : 'color-invert'}>{c('Action')
                        .t`Sharing is end-to-end encrypted`}</span>
                </div>
            </ModalTwo>

            {settingsModal}
            {confirmModal}
        </EditorsManageAccessContextProvider>
    );
};
