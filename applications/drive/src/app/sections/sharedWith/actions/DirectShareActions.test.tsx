import { render, screen, waitFor } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { NodeType, getDrivePerNodeType } from '@proton/drive/sdk';

import useShare from '../../../legacy/store/_shares/useShare';
import { ItemType } from '../types';
import { DirectShareActions } from './DirectShareActions';

const mockGetNode = vi.fn();

vi.mock('@proton/account/user/hooks');

vi.mock('@proton/drive/sdk', async () => ({
    ...(await vi.importActual('@proton/drive/sdk')),
    getDrivePerNodeType: vi.fn(),
}));

vi.mock('../../../legacy/store/_volumes/useVolumesState', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        findVolumeId: vi.fn(),
        setVolumeShareIds: vi.fn(),
        getVolumeShareIds: vi.fn(),
        clear: vi.fn(),
    })),
}));

vi.mock('../../../legacy/store/_shares/useShare');

vi.mock('../../../utils/docs/openInDocs', () => ({
    getOpenInDocsInfo: () => undefined,
    downloadDocument: vi.fn(),
    openDocsOrSheetsDocument: vi.fn(),
}));

vi.mocked(useUser).mockReturnValue([{ Email: 'test@proton.me' } as any, false]);

vi.mocked(useShare).mockReturnValue({
    getSharePrivateKey: vi.fn(),
    getShareWithKey: vi.fn(),
    getShare: vi.fn(),
    getShareCreatorKeys: vi.fn(),
    getShareSessionKey: vi.fn(),
});

function renderDirectShareActions(role: string, buttonType: 'toolbar' | 'contextMenu') {
    return render(
        <DirectShareActions
            selectedItems={[
                {
                    name: 'whatever',
                    type: NodeType.File,
                    size: 1,
                    mediaType: '',
                    activeRevisionUid: '',
                    nodeUid: '111~111',
                    shareId: '222',
                    itemType: ItemType.DIRECT_SHARE,
                    // @ts-ignore importing MemberRole introduces errors
                    role,
                    directShare: {
                        sharedOn: new Date(),
                        sharedBy: 'qwe@as.de',
                    },
                    haveSignatureIssues: false,
                },
            ]}
            showPreviewModal={vi.fn()}
            showConfirmModal={vi.fn()}
            showDetailsModal={vi.fn()}
            showFilesDetailsModal={vi.fn()}
            showCopyModal={vi.fn()}
            showSharingModal={vi.fn()}
            showReportAbuseModal={vi.fn()}
            buttonType={buttonType}
            close={buttonType === 'toolbar' ? undefined : vi.fn()}
        />
    );
}

describe('DirectShareActions', () => {
    it('item can be re-shared if user has admin rights (context menu)', async () => {
        vi.mocked(getDrivePerNodeType).mockReturnValue({ getNode: mockGetNode } as any);
        mockGetNode.mockResolvedValue({
            directRole: 'admin',
            name: { ok: true, value: 'test-node' },
            nameAuthor: { ok: true },
            keyAuthor: { ok: true },
            activeRevision: undefined,
        });

        renderDirectShareActions('admin', 'contextMenu');

        await waitFor(() => {
            expect(screen.getByText('Share')).toBeInTheDocument();
        });
    });

    it('item can be re-shared if user has admin rights (toolbar)', async () => {
        vi.mocked(getDrivePerNodeType).mockReturnValue({ getNode: mockGetNode } as any);
        mockGetNode.mockResolvedValue({
            directRole: 'admin',
            name: { ok: true, value: 'test-node' },
            nameAuthor: { ok: true },
            keyAuthor: { ok: true },
            activeRevision: undefined,
        });

        renderDirectShareActions('admin', 'toolbar');

        await waitFor(() => {
            expect(screen.getByText('Share')).toBeInTheDocument();
        });
    });

    it('item cannot be re-shared if user has admin rights (contextMenu)', async () => {
        vi.mocked(getDrivePerNodeType).mockReturnValue({ getNode: mockGetNode } as any);
        mockGetNode.mockResolvedValue({
            directRole: 'viewer',
            name: { ok: true, value: 'test-node' },
            nameAuthor: { ok: true },
            keyAuthor: { ok: true },
            activeRevision: undefined,
        });

        renderDirectShareActions('viewer', 'contextMenu');

        await waitFor(() => {
            expect(screen.queryByText('Share')).not.toBeInTheDocument();
        });
    });

    it('item cannot be re-shared if user has admin rights (toolbar)', async () => {
        vi.mocked(getDrivePerNodeType).mockReturnValue({ getNode: mockGetNode } as any);
        mockGetNode.mockResolvedValue({
            directRole: 'viewer',
            name: { ok: true, value: 'test-node' },
            nameAuthor: { ok: true },
            keyAuthor: { ok: true },
            activeRevision: undefined,
        });

        renderDirectShareActions('viewer', 'toolbar');

        await waitFor(() => {
            expect(screen.queryByText('Share')).not.toBeInTheDocument();
        });
    });
});
