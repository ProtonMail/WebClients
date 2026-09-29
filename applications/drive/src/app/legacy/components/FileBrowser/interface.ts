import type React from 'react';

import type { AlbumProperties, PhotoProperties } from '../../../legacy/store';

export interface ContextMenuProps {
    anchorRef: React.RefObject<HTMLElement>;
    children?: React.ReactNode;
    isOpen: boolean;
    position:
        | {
              top: number;
              left: number;
          }
        | undefined;
    open: () => void;
    close: () => void;
}

export interface FileBrowserBaseItem {
    id: string;
    linkId: string;
    isLocked?: boolean;
    isInvitation?: boolean;
    isBookmark?: boolean;
    itemRowStyle?: React.CSSProperties;
    isAnonymous?: boolean;
    albumProperties?: AlbumProperties;
    photoProperties?: PhotoProperties;
    // Added to adapt to sdk view
    isAlbum?: boolean;
}

export type BrowserItemId = string;
