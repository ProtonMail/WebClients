import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { MimeIcon, useConfirmActionModal } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';

// TODO: Move that to common place
import { useInvitationsActions } from '../../sections/sharedWith/hooks/useInvitationsActions';
import { loadAlbumInvitations } from '../loaders/loadAlbumInvitations';
import { useAlbumInvitationsStore } from '../useAlbumInvitations.store';

export const AlbumsInvitations = () => {
    const { acceptInvitation, rejectInvitation } = useInvitationsActions();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [isAccepting, withIsAccepting] = useLoading(false);
    const invitations = useAlbumInvitationsStore((state) => [...state.invitations.values()]);
    const removeInvitation = useAlbumInvitationsStore((state) => state.removeInvitation);

    useEffect(function initialLoadOfAlbumsInvitations() {
        const abortController = new AbortController();
        void loadAlbumInvitations(abortController.signal);
        return () => {
            abortController.abort();
        };
    }, []);

    return (
        <>
            {invitations.length !== 0 && (
                <>
                    {invitations.map((invitation) => {
                        const email = (
                            <span key={`span-${invitation.uid}`} className="text-break">
                                {invitation.addedByEmail.ok
                                    ? invitation.addedByEmail.value
                                    : invitation.addedByEmail.error.claimedAuthor}
                            </span>
                        );
                        const name = invitation.node.name.ok
                            ? invitation.node.name.value
                            : invitation.node.name.error.name;

                        const albumName = <strong key={`strong-${invitation.uid}`}>{name}</strong>;
                        return (
                            <div key={invitation.uid} className="banner-invite shrink-0">
                                <div className="banner-invite-inner border border-info rounded m-2 py-1 px-2 flex flex-column md:flex-row flex-nowrap items-center *:min-size-auto">
                                    <div className="flex-1 flex flex-nowrap flex-row items-start py-0.5 mr-2">
                                        <span className="shrink-0 mr-2 p-0.5 ratio-square flex">
                                            <MimeIcon name="album" size={5} className="m-auto" />
                                        </span>
                                        <span className="mt-1">
                                            {
                                                // translator: please keep ${albumName} so album name is properly put in bold. Full sentence example is: doc.brown@proton.me invited you to join <Back to Hill Valley>

                                                c('Info').jt`${email} invited you to join ${albumName}`
                                            }
                                        </span>
                                    </div>
                                    <span className="shrink-0 flex gap-2 py-0.5">
                                        <Button
                                            shape="solid"
                                            color="norm"
                                            loading={isAccepting}
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await withIsAccepting(
                                                    acceptInvitation(
                                                        invitation.node.uid,
                                                        invitation.uid,
                                                        invitation.node.type
                                                    )
                                                );
                                                removeInvitation(invitation.uid);
                                            }}
                                        >
                                            {c('Action').t`Join album`}
                                        </Button>
                                        <Button
                                            shape="ghost"
                                            color="norm"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await rejectInvitation(showConfirmModal, {
                                                    uid: invitation.node.uid,
                                                    invitationUid: invitation.uid,
                                                    name: name,
                                                    type: invitation.node.type,
                                                });
                                                removeInvitation(invitation.uid);
                                            }}
                                        >
                                            {c('Action').t`Decline`}
                                        </Button>
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
