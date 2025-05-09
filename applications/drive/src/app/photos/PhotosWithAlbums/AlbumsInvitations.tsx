import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { MimeIcon, useConfirmActionModal } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { useInvitationsActions } from '../../store';
import { useInvitationsListing } from '../../store/_invitations';

export const AlbumsInvitations = ({ refreshSharedWithMeAlbums }: { refreshSharedWithMeAlbums: () => void }) => {
    const { getCachedInvitations } = useInvitationsListing();
    const { acceptInvitation, rejectInvitation } = useInvitationsActions();
    const cachedInvitations = getCachedInvitations();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const invitations = cachedInvitations.filter((invitation) => invitation.link.type === LinkType.ALBUM);
    return (
        <>
            {invitations.length !== 0 && (
                <>
                    {invitations.map((invitation) => {
                        const email = invitation.share.creatorEmail;
                        const albumName = invitation.decryptedLinkName;
                        return (
                            <div key={invitation.invitation.invitationId} className="banner-invite">
                                <div className="banner-invite-inner border border-info rounded m-2 py-1 px-2 flex flex-row flex-nowrap items-center *:min-size-auto">
                                    <div className="flex-1 flex flex-nowrap flex-row items-start py-0.5">
                                        <span className="shrink-0 mr-2 p-1 ratio-square flex">
                                            <MimeIcon name="album" size={5} className="m-auto" />
                                        </span>
                                        <span className="mt-1 pt-0.5">
                                            {
                                                // translator: please keep **${albumName}** so album name is properly put in bold. Full sentence example is: doc.brown@proton.me invited you to join **Back to Hill Valley**
                                                getBoldFormattedText(
                                                    c('Info').t`${email} invited you to join **${albumName}**`
                                                )
                                            }
                                        </span>
                                    </div>
                                    <span className="shrink-0 flex gap-2 py-0.5">
                                        <Button
                                            shape="solid"
                                            color="norm"
                                            loading={invitation.isLocked}
                                            disabled={invitation.isLocked}
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await acceptInvitation(
                                                    new AbortController().signal,
                                                    invitation.invitation.invitationId
                                                );
                                                void refreshSharedWithMeAlbums();
                                            }}
                                        >
                                            {c('Action').t`Join album`}
                                        </Button>
                                        {!invitation.isLocked && (
                                            <Button
                                                shape="ghost"
                                                color="norm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void rejectInvitation(new AbortController().signal, {
                                                        showConfirmModal,
                                                        invitationId: invitation.invitation.invitationId,
                                                    });
                                                }}
                                            >
                                                {c('Action').t`Decline`}
                                            </Button>
                                        )}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {confirmModal}
                </>
            )}
        </>
    );
};
