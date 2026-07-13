import { render, screen } from '@testing-library/react';

import type { ModalStateReturnObj } from '@proton/components';

import { type AlbumItem, useAlbumsStore } from '../useAlbums.store';
import { AddAlbumPhotosModal } from './AddAlbumPhotosModal';

jest.mock('@proton/drive/index', () => ({ getDriveForPhotos: jest.fn() }));
jest.mock('@proton/drive/modules/thumbnails', () => ({ useThumbnail: () => undefined, loadThumbnail: jest.fn() }));
jest.mock('../PhotosWithAlbums/loaders/loadAdditionalInfo', () => ({ enqueueAdditionalInfo: jest.fn() }));
jest.mock('../loaders/loadAlbums', () => ({ loadAllAlbums: jest.fn() }));

const album = (nodeUid: string, name: string, isShared: boolean) =>
    ({ nodeUid, name, isShared, photoCount: 3, coverNodeUid: undefined }) as unknown as AlbumItem;

// recency order (most recent first): the first two are "Recent"
const ALBUMS = [
    album('recent-a', 'Recent A', false),
    album('recent-b', 'Recent B', false),
    album('shared-c', 'Shared C', true),
    album('plain-d', 'Plain D', false),
];

const renderModal = (share: boolean) => {
    const addAlbumPhotosModal: ModalStateReturnObj = {
        modalProps: { open: true, onClose: jest.fn(), onExit: jest.fn() },
        openModal: jest.fn(),
        render: true,
    };
    return render(
        <AddAlbumPhotosModal
            addAlbumPhotosModal={addAlbumPhotosModal}
            photosNodeUids={['photo-1']}
            onCreateAlbumWithPhotos={jest.fn()}
            onAddAlbumPhotos={jest.fn()}
            share={share}
        />
    );
};

describe('AddAlbumPhotosModal', () => {
    beforeAll(() => {
        global.IntersectionObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof IntersectionObserver;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        useAlbumsStore.setState({
            albums: new Map(ALBUMS.map((a) => [a.nodeUid, a])),
            albumsUids: ALBUMS.map((a) => a.nodeUid),
        });
    });

    it('lists every album in the add flow, including shared ones, split into Recent and All albums', () => {
        renderModal(false);

        // Regression: shared albums must not disappear from the add flow
        ALBUMS.forEach(({ name }) => expect(screen.getByText(name)).toBeInTheDocument());
        expect(screen.getByText('Recent')).toBeInTheDocument();
        expect(screen.getByText('All albums')).toBeInTheDocument();
        expect(screen.queryByText('Add to shared album')).not.toBeInTheDocument();
        expect(screen.getByText('New album')).toBeInTheDocument();
    });

    it('splits shared albums into their own section in the share flow, with no Recent section', () => {
        renderModal(true);

        expect(screen.getByText('Add to shared album')).toBeInTheDocument();
        expect(screen.getByText('All albums')).toBeInTheDocument();
        expect(screen.queryByText('Recent')).not.toBeInTheDocument();
        // Shared album under its section, non-shared albums still listed under All albums
        ['Shared C', 'Recent A', 'Recent B', 'Plain D'].forEach((name) =>
            expect(screen.getByText(name)).toBeInTheDocument()
        );
        expect(screen.getByText('New shared album')).toBeInTheDocument();
    });
});
