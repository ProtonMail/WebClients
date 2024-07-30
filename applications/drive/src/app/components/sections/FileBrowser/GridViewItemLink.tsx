import { FileIcon } from '@proton/components';

import SignatureIcon from '../../SignatureIcon';
import type { DriveItem } from '../Drive/Drive';
import type { SharedLinkItem } from '../SharedLinks/SharedLinks';
import type { SharedWithMeItem } from '../SharedWithMe/SharedWithMe';
import type { TrashItem } from '../Trash/Trash';
import GridViewItemBase from './GridViewItem';
import { getLinkIconText } from './utils';

export function GridViewItem({ item }: { item: DriveItem | TrashItem | SharedLinkItem | SharedWithMeItem }) {
    const iconText = getLinkIconText({
        isFile: item.isFile,
        mimeType: item.mimeType,
        linkName: item.name,
    });

    const IconComponent = (
        <>
            {item.cachedThumbnailUrl ? (
                <img src={item.cachedThumbnailUrl} className="file-browser-grid-item--thumbnail" alt={iconText} />
            ) : (
                <FileIcon
                    className="file-browser-grid-item--icon"
                    size={12}
                    mimeType={item.isFile ? item.mimeType : 'Folder'}
                    alt={iconText}
                />
            )}
        </>
    );

    return (
        <GridViewItemBase
            IconComponent={IconComponent}
            SignatureIconComponent={
                <SignatureIcon
                    isFile={item.isFile}
                    signatureIssues={item.signatureIssues}
                    className="file-browser-grid-view--signature-icon"
                />
            }
            item={item}
        />
    );
}
