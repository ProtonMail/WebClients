import React from 'react';

import { FileIcon } from '@proton/components';
import { NodeType } from '@proton/drive';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

import { FileName } from '../../components/FileName';

interface Props {
    type: NodeType;
    size: number | undefined;
    name: string;
    mediaType: string | undefined;
    className?: string;
}

export const FileCard = ({ mediaType, type, className, name, size }: Props) => {
    return (
        <div className={clsx(['flex', 'flex-nowrap', 'rounded', 'border', 'p-4', 'items-center', className])}>
            <div className="flex flex-column flex-nowrap bg-grey mr-4 shrink-0">
                {/* TODO: Update the FileIcon to support NodeType */}
                <FileIcon size={7} mimeType={type === NodeType.Folder ? 'Folder' : mediaType || 'unknown'} alt={name} />
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
