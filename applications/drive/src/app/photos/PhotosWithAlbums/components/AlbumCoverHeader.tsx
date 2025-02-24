import type { DecryptedAlbum } from '../../PhotosStore/PhotosWithAlbumsProvider';

export const AlbumCoverHeader = ({ album }: { album: DecryptedAlbum }) => (
    <div className="flex shrink-0 flex-row flex-nowrap items-center p-4">
        <img
            src={album.cachedThumbnailUrl || album.cover?.cachedThumbnailUrl}
            alt={album.name}
            className="bg-weak border rounded mr-4 w-1/3 flex h-custom object-cover"
            style={{
                '--h-custom': '14rem', // to remove when img is there, unless placeholder needs it?
            }}
        />
        <div className="flex flex-column flex-nowrap mx-auto shrink-0 flex-1">
            <h1 className="text-bold h2">{album.name}</h1>
            <span className="color-weak">TODO: details to add</span>
        </div>
    </div>
);
