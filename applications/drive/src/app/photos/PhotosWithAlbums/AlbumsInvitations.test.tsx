import { render, screen } from '@testing-library/react';

import { MemberRole, NodeType } from '@proton/drive/index';
import type { ProtonInvitationWithNode } from '@proton/drive/index';

import { loadAlbumInvitations } from '../loaders/loadAlbumInvitations';
import { useAlbumInvitationsStore } from '../useAlbumInvitations.store';
import { AlbumsInvitations } from './AlbumsInvitations';

jest.mock('../loaders/loadAlbumInvitations', () => ({ loadAlbumInvitations: jest.fn() }));
jest.mock('../../sections/sharedWith/hooks/useInvitationsActions', () => ({
    useInvitationsActions: () => ({ acceptInvitation: jest.fn(), rejectInvitation: jest.fn() }),
}));

const baseInvitation: ProtonInvitationWithNode = {
    uid: 'invitation-uid',
    invitationTime: new Date(),
    inviteeEmail: 'invitee@proton.me',
    role: MemberRole.Viewer,
    addedByEmail: { ok: true, value: 'inviter@proton.me' },
    node: { uid: 'node-uid', name: { ok: true, value: 'Back to Hill Valley' }, type: NodeType.Album },
};

describe('AlbumsInvitations', () => {
    beforeEach(() => {
        jest.mocked(loadAlbumInvitations).mockResolvedValue(undefined);
        useAlbumInvitationsStore.getState().setInvitations([]);
    });

    // SECBTY-2220: an inviter identity that fails signature verification must never be
    // rendered as a plain, trusted email next to the "Join" button.
    it('flags the inviter as unverified when addedByEmail cannot be verified', () => {
        useAlbumInvitationsStore.getState().setInvitations([
            {
                ...baseInvitation,
                addedByEmail: { ok: false, error: { claimedAuthor: 'attacker@evil.com', error: 'signature error' } },
            },
        ]);

        render(<AlbumsInvitations />);

        expect(screen.getByText(/attacker@evil\.com \(unverified sender\)/)).toBeInTheDocument();
    });

    it('renders the plain email when addedByEmail is verified', () => {
        useAlbumInvitationsStore.getState().setInvitations([baseInvitation]);

        render(<AlbumsInvitations />);

        expect(screen.getByText('inviter@proton.me')).toBeInTheDocument();
        expect(screen.queryByText(/unverified sender/)).not.toBeInTheDocument();
    });
});
