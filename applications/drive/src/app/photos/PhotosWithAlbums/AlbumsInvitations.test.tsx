import { render, screen } from '@testing-library/react';

import { MemberRole, NodeType } from '@proton/drive/sdk';
import type { ProtonInvitationWithNode } from '@proton/drive/sdk';

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

        const claimedAuthor = screen.getByText('attacker@evil.com');
        expect(claimedAuthor.tagName).toBe('BDI');
        expect(claimedAuthor.parentElement?.textContent).toBe('attacker@evil.com (unverified sender)');
    });

    it('keeps "(unverified sender)" outside of an isolated claimed author that contains bidi overrides', () => {
        useAlbumInvitationsStore.getState().setInvitations([
            {
                ...baseInvitation,
                addedByEmail: {
                    ok: false,
                    error: { claimedAuthor: '\u202Eattacker@evil.com', error: 'signature error' },
                },
            },
        ]);

        render(<AlbumsInvitations />);

        const claimedAuthor = screen.getByText('\u202Eattacker@evil.com');
        expect(claimedAuthor.tagName).toBe('BDI');
        expect(getComputedStyle(claimedAuthor).unicodeBidi).toMatch(/isolate$/);
        expect(claimedAuthor.textContent).not.toContain('unverified');
        expect(claimedAuthor.nextSibling?.textContent).toBe(' (unverified sender)');
    });

    it('renders the plain email when addedByEmail is verified', () => {
        useAlbumInvitationsStore.getState().setInvitations([baseInvitation]);

        render(<AlbumsInvitations />);

        expect(screen.getByText('inviter@proton.me').tagName).toBe('BDI');
        expect(screen.queryByText(/unverified sender/)).not.toBeInTheDocument();
    });
});
