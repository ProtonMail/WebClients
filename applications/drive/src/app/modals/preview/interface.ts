import type { ProtonDriveClient } from '@proton/drive';

/**
 * Drive client required by the preview component.
 *
 * To show the preview, getNode, iterateThumbnails and getFileDownloader
 * are required, as they get metadata, small or HD thumbnails and download
 * the file.
 *
 * Optionally, if the client supports it, getSharingInfo can add ability
 * to show the sharing info and getFileRevisionUploader can add ability
 * to edit the file.
 */
export type Drive = Pick<ProtonDriveClient, 'getNode' | 'iterateThumbnails' | 'getFileDownloader'> &
    Partial<Pick<ProtonDriveClient, 'getSharingInfo' | 'getFileRevisionUploader'>>;
