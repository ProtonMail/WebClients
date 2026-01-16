import {
    type ProtonDriveClient,
    type ProtonDrivePhotosClient,
    type ProtonDrivePublicLinkClient,
    getDrive,
    getDriveForPhotos,
} from '@proton/drive';

/**
 * Centralized registry for drive client instances used in downloads.
 * Allows to pass custom client (like ProtonDrivePublicLinkClient)
 */
class DownloadDriveClientRegistryClass {
    private driveClient: ProtonDriveClient | ProtonDrivePublicLinkClient | undefined;
    private drivePhotosClient: ProtonDrivePhotosClient | undefined;

    getDriveClient(): ProtonDriveClient | ProtonDrivePublicLinkClient {
        return this.driveClient || getDrive();
    }

    getDrivePhotosClient(): ProtonDrivePhotosClient {
        return this.drivePhotosClient || getDriveForPhotos();
    }

    setDriveClient(client: ProtonDriveClient | ProtonDrivePublicLinkClient): void {
        this.driveClient = client;
    }

    setDrivePhotosClient(client: ProtonDrivePhotosClient): void {
        this.drivePhotosClient = client;
    }

    reset(): void {
        this.driveClient = undefined;
        this.drivePhotosClient = undefined;
    }
}

export const DownloadDriveClientRegistry = new DownloadDriveClientRegistryClass();
