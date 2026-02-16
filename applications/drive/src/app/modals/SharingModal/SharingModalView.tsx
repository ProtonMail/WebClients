import type { MouseEvent } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { ContactEmailsProvider, FileIcon, type ModalStateProps, ModalTwo, useToggle } from '@proton/components';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import { MemberRole, type ShareNodeSettings } from '@proton/drive';
import useLoading from '@proton/hooks/useLoading';
import { IcCogWheel } from '@proton/icons/icons/IcCogWheel';
import { IcLockFilled } from '@proton/icons/icons/IcLockFilled';

import ModalContentLoader from '../../components/modals/ModalContentLoader';
import ErrorState from '../../components/modals/ShareLinkModal/ErrorState';
import { useFlagsDriveDirectSharing } from '../../flags/useFlagsDriveDirectSharing';
import { useFlagsDrivePublicSharing } from '../../flags/useFlagsDrivePublicSharing';
import { DirectSharingAutocomplete } from './DirectSharing/DirectSharingAutocomplete';
import { DirectSharingFooter } from './DirectSharing/DirectSharingFooter';
import { DirectSharingInviteMessage } from './DirectSharing/DirectSharingInviteMessage';
import { DirectSharingListing } from './DirectSharing/DirectSharingListing';
import { useShareInvitees } from './DirectSharing/useShareInvitees';
import { PublicSharing } from './PublicSharing/PublicSharing';
import { useSharingSettingsModal } from './SharingSettingsModal';
import type { DirectMember, DirectSharingRole } from './interfaces';

import './SharingModalView.scss';

export interface SharingModalViewProps extends ModalStateProps {
    isLoading: boolean;

    name: string;
    mediaType?: string;
    ownerEmail?: string;
    ownerDisplayName?: string;
    directMembers: DirectMember[];

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
        unshareNode: (email: string) => Promise<void>;
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
    name,
    mediaType,
    ownerEmail,
    ownerDisplayName,
    directMembers,
    isPublicLinkEnabled,
    publicLink,
    errorMessage,
    loadingMessage,
    actions,
    isShared,
}: SharingModalViewProps) => {
    const { isDirectSharingDisabled } = useFlagsDriveDirectSharing();
    const { isPublicEditModeEnabled } = useFlagsDrivePublicSharing();

    const [settingsModal, showSettingsModal] = useSharingSettingsModal();

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

    const existingEmails = useMemo(() => directMembers.map((member) => member.inviteeEmail), [directMembers]);

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
        await actions.updateShareDirect({
            users: [{ email, role }],
        });
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

    const renderModalState = () => {
        if (errorMessage) {
            return <ErrorState onClose={onClose}>{errorMessage}</ErrorState>;
        }

        if (loadingMessage) {
            return <ModalContentLoader>{loadingMessage}</ModalContentLoader>;
        }

        return (
            <ContactEmailsProvider>
                <div className="flex items-center justify-space-between flex-nowrap border-bottom border-weak px-8 py-3 mb-5">
                    <div className="modal-two-header flex items-center flex-nowrap gap-2 m-0">
                        <FileIcon mimeType={mediaType ?? ''} />
                        <span className="modal-two-header-title h4 text-bold text-ellipsis">{c('Title')
                            .t`Share ${name}`}</span>
                    </div>

                    <div className="grow-0 shrink-0">
                        {!isInvitationWorkflow && (
                            <Tooltip disabled={isSettingsDisabled} title={c('Info').t`Share via link settings`}>
                                <Button
                                    icon
                                    shape="ghost"
                                    onClick={() =>
                                        showSettingsModal({
                                            sharedFileName: name,
                                            stopSharing: async () => {
                                                await actions.stopSharing();
                                                onClose();
                                            },
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
                                onRemove={actions.unshareNode}
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
        <>
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
                <div className="double-modal-content shadow-lifted mb-3">{renderModalState()}</div>

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
                    <span className="color-invert">{c('Action').t`Sharing is end-to-end encrypted`}</span>
                </div>
            </ModalTwo>

            {settingsModal}
        </>
    );
};
