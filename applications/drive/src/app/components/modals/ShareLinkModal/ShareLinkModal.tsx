import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    ContactEmailsProvider,
    Icon,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Tooltip,
    useModalTwoStatic,
} from '@proton/components';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';

import { ShareInvitee, ShareMember, useDriveSharingFlags, useShareMemberView, useShareURLView } from '../../../store';
import ModalContentLoader from '../ModalContentLoader';
import { DirectSharingAutocomplete, DirectSharingListing, useShareInvitees } from './DirectSharing';
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
        updateInvitePermissions,
        removeExternalInvitation,
        updateExternalInvitePermissions,
        deleteShareIfEmpty,
    } = useShareMemberView(rootShareId, linkId);

    const [settingsModal, showSettingsModal] = useLinkSharingSettingsModal();

    const isClosedButtonDisabled = isSaving || isDeleting || isCreating || isAdding;
    // It's important in this order. As if it's hasSharedLink is true, isShared is true as well (even if cache not updated)
    const isSharedAvailable = hasSharedLink || isShared;
    const isSettingsDisabled = isShareUrlLoading || isSaving || isDeleting || isCreating || !isSharedAvailable;
    const { invitees, add: addInvitee, remove: removeInvitee, clean: cleanInvitees } = useShareInvitees(existingEmails);

    const isInvitationWorkflow = !!invitees.length;
    const isShareWithAnyoneLoading = isShareUrlLoading || isDeleting || isCreating;

    const handleSubmit = async (invitees: ShareInvitee[], selectedPermissions: SHARE_MEMBER_PERMISSIONS) => {
        await addNewMembers(invitees, selectedPermissions);
        cleanInvitees();
    };

    const handleCancel = () => {
        cleanInvitees();
    };

    const handlePermissionsChange = async (member: ShareMember, permissions: SHARE_MEMBER_PERMISSIONS) => {
        await updateMemberPermissions({ ...member, permissions });
    };

    const handleResendInvitationEmail = async (invitationId: string) => {
        await resendInvitation(invitationId);
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
                        <>
                            <DirectSharingAutocomplete
                                onCancel={handleCancel}
                                isAdding={isAdding}
                                onSubmit={handleSubmit}
                                existingEmails={existingEmails}
                                invitees={invitees}
                                onAdd={addInvitee}
                                onRemove={removeInvitee}
                                hideFormActions={!isInvitationWorkflow}
                            />
                            {!isInvitationWorkflow && (
                                <h2 className="text-lg text-semibold">{c('Info').t`People with access`}</h2>
                            )}
                        </>
                    }
                />
                {!isInvitationWorkflow && (
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
                                onResendInvitationEmail={handleResendInvitationEmail}
                            />
                        </ModalTwoContent>
                        <hr className="mb-0.5" />
                        <ModalTwoFooter>
                            <PublicSharing
                                createSharedLink={createSharedLink}
                                isLoading={isShareWithAnyoneLoading}
                                publicSharedLink={sharedLink}
                                deleteSharedLink={handleDeleteLink}
                            />
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
