import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    ContactEmailsProvider,
    Icon,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    Tooltip,
    useModalTwoStatic,
} from '@proton/components';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';

import {
    ShareInvitee,
    ShareMember,
    useDriveSharingFeatureFlag,
    useShareMemberView,
    useShareURLView,
} from '../../../store';
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
        existingEmails,
        isLoading,
        isAdding,
        addNewMembers,
        removeMember,
        updateMemberPermissions,
        removeInvitation,
        updateInvitePermissions,
    } = useShareMemberView(rootShareId, linkId);

    const [settingsModal, showSettingsModal] = useLinkSharingSettingsModal();

    const isClosedButtonDisabled = isSaving || isDeleting || isCreating || isAdding;
    const isShareActive = !!sharedLink || !!members.length || !!invitations.length;
    const isSettingsDisabled = isShareUrlLoading || isSaving || isDeleting || isCreating || !isShareActive;
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

    const handleInvitationPermissionsChange = async (invitationId: string, permissions: SHARE_MEMBER_PERMISSIONS) => {
        await updateInvitePermissions(invitationId, permissions);
    };

    const handleMemberRemove = async (member: ShareMember) => {
        await removeMember(member);
    };

    const handleInvitationRemove = async (invitationId: string) => {
        await removeInvitation(invitationId);
    };

    const renderModalState = () => {
        if (errorMessage) {
            return <ErrorState onClose={onClose}>{errorMessage}</ErrorState>;
        }

        if (loadingMessage && !isShareUrlLoading) {
            return <ModalContentLoader>{loadingMessage}</ModalContentLoader>;
        }

        return (
            <div className="mb-4">
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
                                      >
                                          <Icon name="cog-wheel" />
                                      </Button>
                                  </Tooltip>,
                              ]
                            : undefined
                    }
                />
                <ModalTwoContent>
                    <ContactEmailsProvider>
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
                            <>
                                <h2 className="text-lg text-semibold">{c('Info').t`Share with`}</h2>
                                <DirectSharingListing
                                    volumeId={volumeId}
                                    linkId={linkId}
                                    isLoading={isLoading}
                                    members={members}
                                    invitations={invitations}
                                    onPermissionsChange={handlePermissionsChange}
                                    onMemberRemove={handleMemberRemove}
                                    onInvitationRemove={handleInvitationRemove}
                                    onInvitationPermissionsChange={handleInvitationPermissionsChange}
                                />
                            </>
                        )}
                    </ContactEmailsProvider>

                    {!isInvitationWorkflow ? (
                        <PublicSharing
                            createSharedLink={createSharedLink}
                            isLoading={isShareWithAnyoneLoading}
                            publicSharedLink={sharedLink}
                            deleteSharedLink={deleteLink}
                        />
                    ) : null}
                </ModalTwoContent>
            </div>
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
    const driveSharing = useDriveSharingFeatureFlag();
    return useModalTwoStatic(driveSharing ? SharingModal : ShareLinkModalLEGACY);
};
