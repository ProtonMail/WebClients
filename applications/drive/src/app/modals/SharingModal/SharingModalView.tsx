import type { MouseEvent } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import {
    ContactEmailsProvider,
    Icon,
    type ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useToggle,
} from '@proton/components';
import {
    type Member,
    MemberRole,
    type NonProtonInvitation,
    type ProtonInvitation,
    type ShareNodeSettings,
} from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';

import ModalContentLoader from '../../components/modals/ModalContentLoader';
import ErrorState from '../../components/modals/ShareLinkModal/ErrorState';
import { useLinkSharingSettingsModal } from '../../components/modals/ShareLinkModal/ShareLinkSettingsModal';
import { useDrivePublicSharingFlags, useDriveSharingFlags } from '../../store';
import { DirectSharingAutocomplete } from './DirectSharing/DirectSharingAutocomplete';
import { DirectSharingInviteMessage } from './DirectSharing/DirectSharingInviteMessage';
import { DirectSharingListing } from './DirectSharing/DirectSharingListing';
import { PublicSharing } from './PublicSharing/PublicSharing';
import { useShareInvitees } from './useShareInvitees';

export interface SharingModalViewProps extends ModalStateProps {
    isLoading: boolean;
    isSaving: boolean;
    isDeleting: boolean;
    isCreating: boolean;
    isShareUrlLoading: boolean;

    name: string;
    volumeId: string;
    linkId: string;
    sharedLink: string | undefined;
    ownerEmail?: string;
    ownerDisplayName?: string;
    permissions: number;
    members: Member[];
    protonInvitations: ProtonInvitation[];
    nonProtonInvitations: NonProtonInvitation[];
    customPassword: string;
    initialExpiration: number | null;
    hasGeneratedPasswordIncluded: boolean;
    confirmationMessage: string;
    isShareUrlEnabled: boolean;

    errorMessage?: string;
    loadingMessage?: string;

    isShared: boolean;
    hasSharedLink: boolean;

    unshareNode: (email: string) => Promise<void>;
    updateShareNode: (shareNodeSettings: ShareNodeSettings) => Promise<void>;
    resendInvitation: (invitationUid: string) => Promise<void>;
    copyInvitationLink: (invitationUid: string, email: string) => void;
    deleteLink: () => Promise<void>;
    onPublicLinkToggle?: (enabled: boolean) => void;

    createSharedLink: () => Promise<void>;
    saveSharedLink: (newCustomPassword?: string, newDuration?: number | null) => Promise<any>;
    updatePermissions: (permissions: number) => Promise<void>;
    stopSharing: () => Promise<void>;
}

export const SharingModalView = ({
    onClose,
    onExit,
    open,
    isLoading,
    isSaving,
    isDeleting,
    isCreating,
    isShareUrlLoading,
    name,
    volumeId,
    linkId,
    sharedLink,
    ownerEmail,
    ownerDisplayName,
    permissions,
    members,
    protonInvitations,
    nonProtonInvitations,
    customPassword,
    initialExpiration,
    hasGeneratedPasswordIncluded,
    confirmationMessage,
    isShareUrlEnabled,
    errorMessage,
    loadingMessage,
    isShared,
    hasSharedLink,
    unshareNode,
    updateShareNode,
    resendInvitation,
    copyInvitationLink,
    deleteLink,
    onPublicLinkToggle,
    createSharedLink,
    saveSharedLink,
    updatePermissions,
    stopSharing,
}: SharingModalViewProps) => {
    const { isDirectSharingDisabled } = useDriveSharingFlags();
    const { isPublicEditModeEnabled } = useDrivePublicSharingFlags();

    const [settingsModal, showSettingsModal] = useLinkSharingSettingsModal();

    const [selectedRole, setRole] = useState<MemberRole>(MemberRole.Editor);
    const [inviteMessage, setInviteMessage] = useState('');
    const {
        state: includeInviteMessage,
        toggle: toggleIncludeInviteMessage,
        set: setIncludeInviteMessage,
    } = useToggle(true);
    const [isAdding, withAdding] = useLoading();

    const existingEmails = useMemo(
        () =>
            members
                .concat(nonProtonInvitations)
                .concat(protonInvitations)
                .map((member) => member.inviteeEmail),
        [members, nonProtonInvitations, protonInvitations]
    );

    const { invitees, add: addInvitee, remove: removeInvitee, clean: cleanInvitees } = useShareInvitees(existingEmails);

    const isInvitationWorkflow = !!invitees.length;
    const isSubmitDisabled = useMemo(
        () => !invitees.length || !!invitees.find((invitee) => invitee.isLoading || invitee.error),
        [invitees]
    );
    const isSettingsDisabled =
        isShareUrlLoading || isSaving || isDeleting || isCreating || !(hasSharedLink || isShared);
    // TODO: Remove isLoading when public sharing is implement in sdk. I am doing that to prevent issue on action on the same share between sdk/store
    const isShareWithAnyoneLoading = isShareUrlLoading || isDeleting || isCreating || isLoading;
    const isClosedButtonDisabled = isSaving || isDeleting || isCreating || isAdding;

    const cleanFields = () => {
        setInviteMessage('');
        setIncludeInviteMessage(true);
        cleanInvitees();
    };

    const handleSubmit = (e: MouseEvent) =>
        withAdding(async () => {
            e.preventDefault();
            await updateShareNode({
                users: invitees.map((invitee) => ({
                    email: invitee.email,
                    role: selectedRole,
                })),
                emailOptions: {
                    message: inviteMessage,
                    includeNodeName: includeInviteMessage,
                },
            });
            cleanFields();
        });

    const handleOnRoleChange = async (email: string, role: MemberRole) => {
        await updateShareNode({
            users: [{ email, role }],
        });
    };

    const handleCancel = () => {
        cleanFields();
    };

    const renderModalState = () => {
        if (errorMessage) {
            return <ErrorState onClose={onClose}>{errorMessage}</ErrorState>;
        }

        if (loadingMessage && !isShareUrlLoading) {
            return <ModalContentLoader>{loadingMessage}</ModalContentLoader>;
        }

        return (
            <ContactEmailsProvider>
                <ModalTwoHeader
                    title={c('Title').t`Share ${name}`}
                    closeButtonProps={{ disabled: isClosedButtonDisabled }}
                    actions={
                        !isInvitationWorkflow
                            ? [
                                  <Tooltip disabled={isSettingsDisabled} title={c('Info').t`Share via link settings`}>
                                      <Button
                                          icon
                                          shape="ghost"
                                          onClick={() =>
                                              showSettingsModal({
                                                  customPassword,
                                                  initialExpiration,
                                                  onSaveLinkClick: saveSharedLink,
                                                  isDeleting,
                                                  stopSharing: async () => {
                                                      await stopSharing();
                                                      onClose();
                                                  },
                                                  havePublicSharedLink: !!sharedLink,
                                                  confirmationMessage,
                                                  modificationDisabled: !hasGeneratedPasswordIncluded,
                                                  isShareUrlEnabled,
                                              })
                                          }
                                          data-testid="share-modal-settings"
                                      >
                                          <Icon name="cog-wheel" />
                                      </Button>
                                  </Tooltip>,
                              ]
                            : undefined
                    }
                    additionalContent={
                        !isInvitationWorkflow ? (
                            <>
                                <DirectSharingAutocomplete
                                    disabled={isDirectSharingDisabled}
                                    existingEmails={existingEmails}
                                    invitees={invitees}
                                    onAdd={addInvitee}
                                    onRemove={removeInvitee}
                                    onChangeRole={setRole}
                                    selectedRole={selectedRole}
                                />
                                <h2 className="text-lg text-semibold">{c('Info').t`People with access`}</h2>
                            </>
                        ) : undefined
                    }
                />
                {!isInvitationWorkflow ? (
                    <>
                        <ModalTwoContent className="mb-5">
                            <DirectSharingListing
                                viewOnly={isDirectSharingDisabled}
                                volumeId={volumeId}
                                linkId={linkId}
                                isLoading={isLoading}
                                ownerEmail={ownerEmail}
                                ownerDisplayName={ownerDisplayName}
                                members={members}
                                protonInvitations={protonInvitations}
                                nonProtonInvitations={nonProtonInvitations}
                                onRemove={unshareNode}
                                onRoleChange={handleOnRoleChange}
                                onResendInvitation={resendInvitation}
                                onCopyInvitationLink={copyInvitationLink}
                            />
                        </ModalTwoContent>
                        {isShareUrlEnabled ? (
                            <>
                                <hr className="mb-0.5 min-h-px" />
                                <ModalTwoFooter>
                                    <PublicSharing
                                        viewOnly={!isPublicEditModeEnabled}
                                        createSharedLink={createSharedLink}
                                        isLoading={isShareWithAnyoneLoading}
                                        publicSharedLink={sharedLink || ''}
                                        publicSharedLinkPermissions={permissions}
                                        onChangePermissions={updatePermissions}
                                        deleteSharedLink={deleteLink}
                                        onPublicLinkToggle={onPublicLinkToggle}
                                    />
                                </ModalTwoFooter>
                            </>
                        ) : null}
                    </>
                ) : (
                    <>
                        <ModalTwoContent className="mb-5">
                            <DirectSharingAutocomplete
                                disabled={isDirectSharingDisabled}
                                existingEmails={existingEmails}
                                invitees={invitees}
                                onAdd={addInvitee}
                                onRemove={removeInvitee}
                                onChangeRole={setRole}
                                selectedRole={selectedRole}
                            />
                            <DirectSharingInviteMessage
                                isAdding={isAdding}
                                inviteMessage={inviteMessage}
                                includeInviteMessage={includeInviteMessage}
                                onChangeInviteMessage={setInviteMessage}
                                onToggleIncludeInviteMessage={toggleIncludeInviteMessage}
                            />
                        </ModalTwoContent>
                        <ModalTwoFooter>
                            <div className="w-full flex justify-space-between mb-4">
                                <Button disabled={isAdding} onClick={handleCancel}>{c('Action').t`Cancel`}</Button>
                                <Button
                                    type="submit"
                                    color="norm"
                                    disabled={isSubmitDisabled}
                                    loading={isAdding}
                                    onClick={handleSubmit}
                                >
                                    {c('Action').t`Share`}
                                </Button>
                            </div>
                        </ModalTwoFooter>
                    </>
                )}
            </ContactEmailsProvider>
        );
    };

    return (
        <>
            <ModalTwo
                as="form"
                onClose={onClose}
                onExit={onExit}
                onReset={(e: any) => {
                    e.preventDefault();
                    onClose();
                }}
                disableCloseOnEscape={isSaving || isDeleting}
                size="large"
                fullscreenOnMobile
                open={open}
            >
                {renderModalState()}
            </ModalTwo>
            {settingsModal}
        </>
    );
};
