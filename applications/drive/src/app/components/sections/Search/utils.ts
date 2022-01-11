import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { SearchFileBrowserItem } from '../../search/SearchResultsStorage';
import { ESLink } from '../../search/types';

export const convertToFileBrowserItem = (item: ESLink): SearchFileBrowserItem => {
    return {
        HasThumbnail: false,
        LinkID: item.linkId,
        MIMEType: item.MIMEType,
        ModifyTime: item.modifiedTime,
        Name: item.decryptedName,
        // All indexed items have parent link
        ParentLinkID: item.parentLinkId!,
        RealModifyTime: item.modifiedTime,
        ShareID: item.shareId,
        Size: item.size,
        Trashed: null,
        Type: item.MIMEType === 'Folder' ? LinkType.FOLDER : LinkType.FILE,
        UrlsExpired: false,
    };
};
