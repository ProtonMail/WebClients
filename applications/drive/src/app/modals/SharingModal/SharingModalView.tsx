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
import { MemberRole, type ShareNodeSettings } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';

import ModalContentLoader from '../../components/modals/ModalContentLoader';
import ErrorState from '../../components/modals/ShareLinkModal/ErrorState';
import { useFlagsDriveDirectSharing } from '../../flags/useFlagsDriveDirectSharing';
import { useFlagsDrivePublicSharing } from '../../flags/useFlagsDrivePublicSharing';
import { DirectSharingAutocomplete } from './DirectSharing/DirectSharingAutocomplete';
import { DirectSharingInviteMessage } from './DirectSharing/DirectSharingInviteMessage';
import { DirectSharingListing } from './DirectSharing/DirectSharingListing';
import { useShareInvitees } from './DirectSharing/useShareInvitees';
import { PublicSharing } from './PublicSharing/PublicSharing';
import { useSharingSettingsModal } from './SharingSettingsModal';
import type { DirectMember } from './interfaces';

export interface SharingModalViewProps extends ModalStateProps {
    isLoading: boolean;

    name: string;
    linkId: string;
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
    linkId,
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

    const [selectedRole, setRole] = useState<MemberRole>(MemberRole.Editor);
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
            cleanFields();
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
                                                  customPassword: publicLink?.customPassword,
                                                  expiration: publicLink?.expirationTime,
                                                  onPublicLinkSettingsChange: handleUpdatePublicLink,
                                                  stopSharing: async () => {
                                                      await actions.stopSharing();
                                                      onClose();
                                                  },
                                                  havePublicLink: !!publicLink?.url,
                                                  isPublicLinkEnabled,
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
                                linkId={linkId}
                                isLoading={isLoading}
                                ownerEmail={ownerEmail}
                                ownerDisplayName={ownerDisplayName}
                                members={directMembers}
                                onRemove={actions.unshareNode}
                                onChangeRole={handleChangeRole}
                                onResendInvitation={actions.resendInvitation}
                                onCopyInvitationLink={actions.copyInvitationLink}
                            />
                        </ModalTwoContent>
                        {isPublicLinkEnabled ? (
                            <>
                                <hr className="mb-0.5 min-h-px" />
                                <ModalTwoFooter>
                                    <PublicSharing
                                        viewOnly={!isPublicEditModeEnabled}
                                        onCreate={handleCreatePublicLink}
                                        isLoading={isShareWithAnyoneLoading}
                                        url={publicLink?.url}
                                        role={publicLink?.role || MemberRole.Viewer}
                                        onChangeRole={handleUpdatePublicLink}
                                        onDelete={handleDeletePublicLink}
                                        onToggle={actions.onPublicLinkToggle}
                                        disabledToggle={publicLinkUpdating}
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
                                    onClick={handleSubmitDirectSharing}
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
                disableCloseOnEscape={publicLinkStateChanging || publicLinkUpdating || isAdding}
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
