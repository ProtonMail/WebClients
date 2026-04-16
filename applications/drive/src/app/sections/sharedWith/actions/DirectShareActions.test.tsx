import { render, screen, waitFor } from '@testing-library/react';

import { NodeType, getDrivePerNodeType } from '@proton/drive';

import useShare from '../../../store/_shares/useShare';
import { ItemType } from '../types';
import { DirectShareActions } from './DirectShareActions';

const mockGetNode = jest.fn();

jest.mock('@proton/drive', () => ({
    ...jest.requireActual('@proton/drive'),
    getDrivePerNodeType: jest.fn(),
}));

jest.mock('../../../store/_volumes/useVolumesState', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        findVolumeId: jest.fn(),
        setVolumeShareIds: jest.fn(),
        getVolumeShareIds: jest.fn(),
        clear: jest.fn(),
    })),
}));

jest.mock('../../../store/_shares/useShare');

jest.mock('../../../store/_documents/useOpenDocument', () => ({
    ...jest.requireActual('../../../store/_documents/useOpenDocument'),
    useOpenDocument: jest.fn(() => ({
        openDocumentWindow: jest.fn(),
    })),
}));
jest.mocked(useShare).mockReturnValue({
    getSharePrivateKey: jest.fn(),
    getShareWithKey: jest.fn(),
    getShare: jest.fn(),
    getShareCreatorKeys: jest.fn(),
    getShareSessionKey: jest.fn(),
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
            showPreviewModal={jest.fn()}
            showConfirmModal={jest.fn()}
            showDetailsModal={jest.fn()}
            showFilesDetailsModal={jest.fn()}
            showCopyModal={jest.fn()}
            showSharingModal={jest.fn()}
            buttonType={buttonType}
            close={buttonType === 'toolbar' ? undefined : jest.fn()}
        />
    );
}

describe('DirectShareActions', () => {
    it('item can be re-shared if user has admin rights (context menu)', async () => {
        jest.mocked(getDrivePerNodeType).mockReturnValue({ getNode: mockGetNode } as any);
        mockGetNode.mockResolvedValue({
            ok: true,
            value: {
                directRole: 'admin',
            },
        });

        renderDirectShareActions('admin', 'contextMenu');

        await waitFor(() => {
            expect(screen.getByText('Share')).toBeInTheDocument();
        });
    });

    it('item can be re-shared if user has admin rights (toolbar)', async () => {
        jest.mocked(getDrivePerNodeType).mockReturnValue({ getNode: mockGetNode } as any);
        mockGetNode.mockResolvedValue({
            ok: true,
            value: {
                directRole: 'admin',
            },
        });

        renderDirectShareActions('admin', 'toolbar');

        await waitFor(() => {
            expect(screen.getByText('Share')).toBeInTheDocument();
        });
    });

    it('item cannot be re-shared if user has admin rights (contextMenu)', async () => {
        jest.mocked(getDrivePerNodeType).mockReturnValue({ getNode: mockGetNode } as any);
        mockGetNode.mockResolvedValue({
            ok: true,
            value: {
                directRole: 'viewer',
            },
        });

        renderDirectShareActions('viewer', 'contextMenu');

        await waitFor(() => {
            expect(screen.queryByText('Share')).not.toBeInTheDocument();
        });
    });

    it('item cannot be re-shared if user has admin rights (toolbar)', async () => {
        jest.mocked(getDrivePerNodeType).mockReturnValue({ getNode: mockGetNode } as any);
        mockGetNode.mockResolvedValue({
            ok: true,
            value: {
                directRole: 'viewer',
            },
        });

        renderDirectShareActions('viewer', 'toolbar');

        await waitFor(() => {
            expect(screen.queryByText('Share')).not.toBeInTheDocument();
        });
    });
});
