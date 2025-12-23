import type { MouseEvent, ReactNode, TouchEvent } from 'react';

import { c } from 'ttag';

import { FileIcon } from '@proton/components';
import { NodeType } from '@proton/drive';
import { isCompatibleCBZ } from '@proton/shared/lib/helpers/mimetype';
import clsx from '@proton/utils/clsx';

import { getLinkIconText } from '../../../../components/sections/FileBrowser/utils';

export interface GridItemContentProps {
    type: NodeType;
    name: string;
    mediaType?: string;
    thumbnailUrl?: string;
    isInvitation?: boolean;
    badge?: ReactNode;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
    onTouchEnd?: (e: TouchEvent<HTMLButtonElement>) => void;
}

export function GridItemContent({
    type,
    name,
    mediaType,
    thumbnailUrl,
    isInvitation = false,
    badge,
    onClick,
    onTouchEnd,
}: GridItemContentProps) {
    const iconText = getLinkIconText({
        linkName: name,
        mimeType: mediaType || '',
        isFile: type === NodeType.File || type === NodeType.Photo,
    });

    const IconComponent = (
        <>
            {type === NodeType.Album && (
                <FileIcon
                    mimeType="Album"
                    alt={c('Label').t`Album`}
                    size={12}
                    style={isInvitation ? { filter: 'grayscale(100%)' } : undefined}
                />
            )}
            {thumbnailUrl && type !== NodeType.Album && (
                <img
                    src={thumbnailUrl}
                    className={clsx(
                        'w-full h-full',
                        mediaType && isCompatibleCBZ(mediaType, name) ? 'object-contain' : 'object-cover'
                    )}
                    style={{ objectPosition: 'center' }}
                    alt={iconText}
                />
            )}
            {!thumbnailUrl && type !== NodeType.Album && (
                <FileIcon
                    mimeType={(type === NodeType.File && mediaType) || 'Folder'}
                    alt={iconText}
                    size={12}
                    style={isInvitation ? { filter: 'grayscale(100%)' } : undefined}
                />
            )}
        </>
    );

    return (
        <>
            {badge && <div className="absolute top-0 right-0 mt-1 mr-1">{badge}</div>}
            {onClick ? (
                <button
                    className="w-full h-full cursor-pointer flex items-center justify-center"
                    onClick={onClick}
                    onTouchEnd={onTouchEnd}
                >
                    {IconComponent}
                </button>
            ) : (
                <div className="w-full h-full flex items-center justify-center">{IconComponent}</div>
            )}
        </>
    );
}
