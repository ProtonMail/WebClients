import React from 'react';

import { FileIcon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { Cells } from '../../FileBrowser';
import { FileName } from '../../FileName';
import type { LinkInfo } from './types';

interface Props {
    linkInfo: LinkInfo;
    className?: string;
}

export const FileCard = ({ linkInfo, className }: Props) => {
    return (
        <div className={clsx(['flex', 'flex-nowrap', 'rounded', 'border', 'p-4', 'items-center', className])}>
            <div className="flex flex-column flex-nowrap bg-grey mr-4 shrink-0">
                <FileIcon size={7} mimeType={linkInfo.mimeType} alt={linkInfo.name} />
            </div>
            <div className="flex flex-column flex-nowrap">
                <div className="text-bold flex w-full">
                    <FileName text={linkInfo.name} />
                </div>
                {linkInfo.mimeType !== 'Folder' && <Cells.SizeCell size={linkInfo.size} />}
            </div>
        </div>
    );
};
