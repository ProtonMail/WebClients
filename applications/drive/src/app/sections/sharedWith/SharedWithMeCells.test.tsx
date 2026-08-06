import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Breakpoints } from '@proton/components';
import { MemberRole, NodeType } from '@proton/drive';

import { getSharedWithMeCells } from './SharedWithMeCells';
import type { BookmarkItem, DirectShareItem, InvitationItem, SharedWithMeItem } from './types';
import { ItemType } from './types';
import { getKeyUid, useSharedWithMeStore } from './useSharedWithMe.store';

jest.mock('@proton/drive/legacy/errorHandling', () => ({ handleSdkError: jest.fn() }));
jest.mock('@proton/drive/legacy/sdkUtils/getNodeEntity', () => ({ getNodeEntity: jest.fn() }));
jest.mock('@proton/drive/modules/busDriver', () => ({ BusDriverEventName: {}, getBusDriver: jest.fn() }));

const mockShowSharingModal = jest.fn();
jest.mock('@proton/drive/modals/sharingModal', () => ({
    useSharingModal: () => ({
        sharingModal: null,
        showSharingModal: mockShowSharingModal,
    }),
}));

const baseItem = {
    name: 'Item',
    type: NodeType.File,
    size: undefined,
    mediaType: undefined,
    activeRevisionUid: undefined,
};

const makeDirectShare = (role: MemberRole): DirectShareItem => ({
    ...baseItem,
    nodeUid: 'volume~node',
    shareId: 'share-1',
    itemType: ItemType.DIRECT_SHARE,
    haveSignatureIssues: false,
    role,
    directShare: { sharedOn: new Date('2024-01-01'), sharedBy: 'someone@example.com' },
});

const makeInvitation = (): InvitationItem => ({
    ...baseItem,
    nodeUid: 'volume~node',
    shareId: 'share-1',
    itemType: ItemType.INVITATION,
    invitation: { uid: 'invitation-1', sharedBy: 'someone@example.com' },
});

const makeBookmark = (): BookmarkItem => ({
    ...baseItem,
    itemType: ItemType.BOOKMARK,
    bookmark: { uid: 'bookmark-1', url: 'https://drive.proton.me/urls/whatever', creationTime: new Date('2024-01-01') },
});

function renderShareOptionsCell(item: SharedWithMeItem) {
    useSharedWithMeStore.setState({ sharedWithMeItems: new Map([[getKeyUid(item), item]]) });

    const cells = getSharedWithMeCells({
        viewportWidth: { '>=large': true } as Breakpoints['viewportWidth'],
        onRenderItem: jest.fn(),
        showConfirmModal: jest.fn(),
    });
    const shareOptionsCell = cells.find((cell) => cell.id === 'share-options');
    if (!shareOptionsCell) {
        throw new Error('Share options cell should be defined');
    }

    return render(<>{shareOptionsCell.render(getKeyUid(item))}</>);
}

describe('getSharedWithMeCells share options cell', () => {
    beforeEach(() => {
        mockShowSharingModal.mockClear();
        useSharedWithMeStore.setState({ sharedWithMeItems: new Map() });
    });

    it('shows the share button for a direct share where the member is admin', async () => {
        const item = makeDirectShare(MemberRole.Admin);
        renderShareOptionsCell(item);

        await userEvent.click(screen.getByRole('button', { name: 'Manage share' }));

        expect(mockShowSharingModal).toHaveBeenCalledWith(expect.objectContaining({ nodeUid: item.nodeUid }));
    });

    it.each([
        ['a direct share where the member is only an editor', makeDirectShare(MemberRole.Editor)],
        ['a direct share where the member is only a viewer', makeDirectShare(MemberRole.Viewer)],
        ['a pending invitation', makeInvitation()],
        ['a public link bookmark', makeBookmark()],
    ])('does not show the share button for %s', (_label, item) => {
        renderShareOptionsCell(item);

        expect(screen.queryByRole('button', { name: 'Manage share' })).not.toBeInTheDocument();
    });
});
