import type { ProtonDriveClient } from '@protontech/drive-sdk';
import type { ProtonDrivePhotosClient } from '@protontech/drive-sdk/dist/protonDrivePhotosClient';
import type { ProtonDrivePublicLinkClient } from '@protontech/drive-sdk/dist/protonDrivePublicLinkClient';

import { getDrive, getDriveForPhotos } from '../../index';

/**
 * Centralized registry for drive client instances used in uploads.
 * Allows to pass custom client (like ProtonDrivePublicLinkClient)
 */
class UploadDriveClientRegistryClass {
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

export const UploadDriveClientRegistry = new UploadDriveClientRegistryClass();
