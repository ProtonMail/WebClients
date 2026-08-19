/**
 * Maps a Drive pathname to the part of the app it belongs to, so `get_current_folder` can name where the
 * user is even when it is not the folder browser. Route shapes come from `MainContainer`'s top-level
 * routes (`applications/drive/src/app/containers/MainContainer.tsx`).
 */

export type OtherDriveSection = 'filePreview' | 'photos' | 'trash' | 'sharedWithMe' | 'sharedByMe' | 'devices';

export const isFolderRoute = (pathname: string) => pathname.includes('/folder/');

export const getOtherDriveSection = (pathname: string): OtherDriveSection | undefined => {
    if (pathname.includes('/file/')) {
        return 'filePreview';
    }
    if (pathname.includes('/photos')) {
        return 'photos';
    }
    if (pathname.includes('/trash')) {
        return 'trash';
    }
    if (pathname.includes('/shared-with-me')) {
        return 'sharedWithMe';
    }
    if (pathname.includes('/shared-urls')) {
        return 'sharedByMe';
    }
    if (pathname.includes('/devices')) {
        return 'devices';
    }
    return undefined;
};

const SECTION_LABELS: Record<OtherDriveSection, string> = {
    filePreview: 'a file preview',
    photos: 'Photos',
    trash: 'Trash',
    sharedWithMe: 'Shared with me',
    sharedByMe: 'Shared by me',
    devices: 'Devices',
};

export const describeDriveSection = (section: OtherDriveSection): string => SECTION_LABELS[section];
