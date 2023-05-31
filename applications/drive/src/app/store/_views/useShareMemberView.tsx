import { useEffect, useState } from 'react';

import { PublicKeyReference } from '@proton/crypto';
import { encodeBase64 } from '@proton/crypto/lib/utils';
import { useLoading } from '@proton/hooks';
import { encryptPassphraseSessionKey } from '@proton/shared/lib/calendar/crypto/keys/calendarKeys';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';

import { useLink } from '../_links';
import { ShareInvitee, ShareMember, useShare, useShareMember } from '../_shares';

const useShareMemberView = (rootShareId: string, linkId: string) => {
    const { removeShareMember, addShareMember, getShareMembers, getShareIdWithSessionkey } = useShareMember();
    const [shareId, setShareId] = useState<string>();
    const { getLink } = useLink();
    const [isLoading, withLoading] = useLoading();
    const [isDeleting, withDeleting] = useLoading();
    const [isAdding, withAdding] = useLoading();
    const { getShare, getSharePrivateKey, getShareSessionKey } = useShare();
    const [members, setMembers] = useState<ShareMember[]>([]);

    useEffect(() => {
        const abortController = new AbortController();
        void withLoading(async () => {
            const link = await getLink(abortController.signal, rootShareId, linkId);
            if (!link.shareId) {
                return;
            }

            setShareId(link.shareId);

            await getShareMembers(abortController.signal, link.shareId).then((members) => {
                if (members) {
                    setMembers(members);
                }
            });
        });

        return () => {
            abortController.abort();
        };
    }, [rootShareId, linkId]);

    const removeMember = async (memberId: string) => {
        if (!shareId) {
            return;
        }
        const abortSignal = new AbortController().signal;
        await withDeleting(removeShareMember(abortSignal, shareId, memberId));
        setMembers(members.filter((member) => member.memberId !== memberId));
    };

    const addNewMember = async (invitees: ShareInvitee[], permissions: SHARE_MEMBER_PERMISSIONS) => {
        const memberPublicKeys = invitees.reduce<{ [email: string]: PublicKeyReference }>(
            (acc, { email, publicKey }) => {
                if (!publicKey) {
                    throw new Error('No public key for member');
                }
                acc[email] = publicKey;

                return acc;
            },
            {}
        );

        const abortSignal = new AbortController().signal;

        await withAdding(async () => {
            const { shareId: linkShareId, sessionKey } = shareId
                ? { shareId, sessionKey: await getShareSessionKey(abortSignal, rootShareId) }
                : await getShareIdWithSessionkey(abortSignal, rootShareId, linkId);
            const primaryAddressKey = await getSharePrivateKey(abortSignal, linkShareId);

            if (!primaryAddressKey) {
                throw new Error('Could not find primary address key for calendar owner');
            }

            const share = await getShare(abortSignal, linkShareId);
            const { armoredSignature, encryptedSessionKeyMap } = await encryptPassphraseSessionKey({
                sessionKey,
                memberPublicKeys,
                signingKey: primaryAddressKey,
            });

            const newMembers = await Promise.all(
                Object.keys(memberPublicKeys).map(async (email) => {
                    const keyPacket = encryptedSessionKeyMap[email];
                    if (!keyPacket) {
                        throw new Error('No passphrase key packet for member');
                    }
                    return addShareMember(abortSignal, linkShareId, {
                        email,
                        keyPacket,
                        permissions,
                        inviter: share.creator,
                        keyPacketSignature: encodeBase64(armoredSignature),
                    });
                })
            );

            // Because initially when there is no share we don't have the list of share members.
            // After creating the share and adding the new members we want to retrieve the full list with also the owner
            // In the other case we just add the new members to the existing list
            if (!members.length) {
                const allMembers = await getShareMembers(abortSignal, linkShareId);
                if (allMembers) {
                    setMembers(allMembers);
                }
            } else {
                setMembers((prevMembers) => {
                    return [...prevMembers, ...newMembers];
                });
            }
        });
    };

    return { members, isLoading, isAdding, isDeleting, addNewMember, removeMember };
};

export default useShareMemberView;
