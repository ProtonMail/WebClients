import type { MouseEvent } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import {
    ContactEmailsProvider,
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Tooltip,
    useModalTwoStatic,
    useToggle,
} from '@proton/components';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';

import type { ShareMember } from '../../../store';
import { useDriveSharingFlags, useShareMemberView, useShareURLView } from '../../../store';
import ModalContentLoader from '../ModalContentLoader';
import { DirectSharingAutocomplete, DirectSharingListing, useShareInvitees } from './DirectSharing';
import { DirectSharingInviteMessage } from './DirectSharing/DirectSharingInviteMessage';
import ErrorState from './ErrorState';
import { PublicSharing } from './PublicSharing';
import { useLinkSharingSettingsModal } from './ShareLinkSettingsModal';
import { ShareLinkModalLEGACY } from './_legacy/ShareLinkModalLEGACY';

interface Props {
    modalTitleID?: string;
    shareId: string;
    linkId: string;
}

export function SharingModal({ shareId: rootShareId, linkId, onClose, ...modalProps }: Props & ModalStateProps) {
    const {
        customPassword,
        initialExpiration,
        name,
        deleteLink,
        stopSharing,
        sharedLink,
        hasSharedLink,
        errorMessage,
        loadingMessage,
        confirmationMessage,
        hasGeneratedPasswordIncluded,
        createSharedLink,
        saveSharedLink,
        isSaving,
        isDeleting,
        isCreating,
        isShareUrlLoading,
        isShareUrlEnabled,
    } = useShareURLView(rootShareId, linkId);

    const {
        volumeId,
        members,
        invitations,
        externalInvitations,
        existingEmails,
        isLoading,
        isAdding,
        isShared,
        addNewMembers,
        removeMember,
        updateMemberPermissions,
        removeInvitation,
        resendInvitation,
        resendExternalInvitation,
        updateInvitePermissions,
        removeExternalInvitation,
        updateExternalInvitePermissions,
        deleteShareIfEmpty,
    } = useShareMemberView(rootShareId, linkId);

    const { isDirectSharingDisabled } = useDriveSharingFlags();

    const [settingsModal, showSettingsModal] = useLinkSharingSettingsModal();

    const [selectedPermissions, setPermissions] = useState<SHARE_MEMBER_PERMISSIONS>(MEMBER_PERMISSIONS.EDITOR);
    const [inviteMessage, setInviteMessage] = useState('');
    const {
        state: includeInviteMessage,
        toggle: toggleIncludeInviteMessage,
        set: setIncludeInviteMessage,
    } = useToggle(true);

    const isClosedButtonDisabled = isSaving || isDeleting || isCreating || isAdding;
    // It's important in this order. As if it's hasSharedLink is true, isShared is true as well (even if cache not updated)
    const isSharedAvailable = hasSharedLink || isShared;
    const isSettingsDisabled = isShareUrlLoading || isSaving || isDeleting || isCreating || !isSharedAvailable;
    const { invitees, add: addInvitee, remove: removeInvitee, clean: cleanInvitees } = useShareInvitees(existingEmails);

    const isInvitationWorkflow = !!invitees.length;
    const isShareWithAnyoneLoading = isShareUrlLoading || isDeleting || isCreating;
    const isDirectSharingAutocompleteDisabled = isAdding || isLoading || isDirectSharingDisabled;

    const cleanFields = () => {
        setInviteMessage('');
        setIncludeInviteMessage(true);
        cleanInvitees();
    };

    const handleSubmit = async (e: MouseEvent) => {
        e.preventDefault();
        await addNewMembers({
            invitees,
            permissions: selectedPermissions,
            emailDetails: includeInviteMessage
                ? {
                      message: inviteMessage,
                      itemName: name,
                  }
                : undefined,
        });
        cleanFields();
    };

    // Here we check if the email address is already in invited members
    const isSubmitDisabled = useMemo(
        () => !invitees.length || !!invitees.find((invitee) => invitee.isLoading || invitee.error),
        [invitees]
    );

    const handleCancel = () => {
        cleanFields();
    };

    const handlePermissionsChange = async (member: ShareMember, permissions: SHARE_MEMBER_PERMISSIONS) => {
        await updateMemberPermissions({ ...member, permissions });
    };

    const handleDeleteLink = async () => {
        await deleteLink();
        await deleteShareIfEmpty();
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
                                    disabled={isDirectSharingAutocompleteDisabled}
                                    existingEmails={existingEmails}
                                    invitees={invitees}
                                    onAdd={addInvitee}
                                    onRemove={removeInvitee}
                                    onChangePermissions={setPermissions}
                                    selectedPermissions={selectedPermissions}
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
                                volumeId={volumeId}
                                linkId={linkId}
                                isLoading={isLoading}
                                members={members}
                                invitations={invitations}
                                externalInvitations={externalInvitations}
                                onPermissionsChange={handlePermissionsChange}
                                onMemberRemove={removeMember}
                                onInvitationRemove={removeInvitation}
                                onInvitationPermissionsChange={updateInvitePermissions}
                                onExternalInvitationRemove={removeExternalInvitation}
                                onExternalInvitationPermissionsChange={updateExternalInvitePermissions}
                                onResendInvitationEmail={resendInvitation}
                                onResendExternalInvitationEmail={resendExternalInvitation}
                            />
                        </ModalTwoContent>
                        {!isShareUrlEnabled ? (
                            <>
                                <hr className="mb-0.5 min-h-px" />
                                <ModalTwoFooter>
                                    <PublicSharing
                                        createSharedLink={createSharedLink}
                                        isLoading={isShareWithAnyoneLoading}
                                        publicSharedLink={sharedLink}
                                        deleteSharedLink={handleDeleteLink}
                                    />
                                </ModalTwoFooter>
                            </>
                        ) : null}
                    </>
                ) : (
                    <>
                        <ModalTwoContent className="mb-5">
                            <DirectSharingAutocomplete
                                disabled={isDirectSharingAutocompleteDisabled}
                                existingEmails={existingEmails}
                                invitees={invitees}
                                onAdd={addInvitee}
                                onRemove={removeInvitee}
                                onChangePermissions={setPermissions}
                                selectedPermissions={selectedPermissions}
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
                onReset={(e: any) => {
                    e.preventDefault();
                    onClose();
                }}
                disableCloseOnEscape={isSaving || isDeleting}
                size="large"
                fullscreenOnMobile
                {...modalProps}
            >
                {renderModalState()}
            </ModalTwo>
            {settingsModal}
        </>
    );
}

export const useLinkSharingModal = () => {
    const { isSharingInviteAvailable } = useDriveSharingFlags();
    return useModalTwoStatic(isSharingInviteAvailable ? SharingModal : ShareLinkModalLEGACY);
};
