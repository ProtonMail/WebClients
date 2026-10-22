import React from 'react';

import { NodeType } from '@proton/drive/sdk';
import { getFileIcon } from '@proton/file-icons/getFileIcon';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

import { FileName } from '../../legacy/components/FileName';

interface Props {
    type: NodeType;
    size: number | undefined;
    name: string;
    mediaType: string | undefined;
    className?: string;
}

export const FileCard = ({ mediaType, type, className, name, size }: Props) => {
    const NodeIcon = getFileIcon(type === NodeType.Folder ? 'Folder' : mediaType || 'unknown');

    return (
        <div className={clsx(['flex', 'flex-nowrap', 'rounded', 'border', 'p-4', 'items-center', className])}>
            <div className="flex flex-column flex-nowrap bg-grey mr-4 shrink-0">
                {/* TODO: Update getFileIcon to support NodeType */}
                <NodeIcon size={7} alt={name} className="shrink-0" />
            </div>
            <div className="flex flex-column flex-nowrap">
                <div className="text-bold flex w-full">
                    <FileName text={name} />
                </div>
                {(type === NodeType.File || type === NodeType.Photo) && (
                    <span className="text-pre">
                        {size === undefined ? <span className="text-pre">--</span> : humanSize({ bytes: size })}
                    </span>
                )}
            </div>
        </div>
    );
};
