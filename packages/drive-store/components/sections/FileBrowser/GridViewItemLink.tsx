import { FileIcon } from '@proton/components';
import { isCompatibleCBZ } from '@proton/shared/lib/helpers/mimetype';
import clsx from '@proton/utils/clsx';

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
                <img
                    src={item.cachedThumbnailUrl}
                    className={clsx(
                        'file-browser-grid-item--thumbnail',
                        // TODO: DRVWEB-4404
                        // In the future: Music Cover, M4B Audiobook Cover, and other types that are not images that also have covers in their metadata
                        isCompatibleCBZ(item.mimeType, item.name) ? 'object-contain' : 'object-cover'
                    )}
                    alt={iconText}
                />
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
                    isAnonymous={item.isAnonymous}
                    className="file-browser-grid-view--signature-icon"
                />
            }
            item={item}
        />
    );
}
