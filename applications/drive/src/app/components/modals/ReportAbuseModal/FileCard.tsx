import React from 'react';

import { FileIcon, FileNameDisplay } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { Cells } from '../../FileBrowser';
import { LinkInfo } from './types';

interface Props {
    linkInfo: LinkInfo;
    className?: string;
}

export const FileCard = ({ linkInfo, className }: Props) => {
    return (
        <div
            className={clsx(['flex', 'flex-nowrap', 'rounded', 'border', 'p-4', 'items-center', className])}
        >
            <div className="flex flex-column flex-nowrap bg-grey mr-4 flex-item-noshrink">
                <FileIcon size={28} mimeType={linkInfo.mimeType} alt={linkInfo.name} />
            </div>
            <div className="flex flex-column flex-nowrap">
                <div className="text-bold flex w-full">
                    <FileNameDisplay text={linkInfo.name} />
                </div>
                {linkInfo.mimeType !== 'Folder' && <Cells.SizeCell size={linkInfo.size} />}
            </div>
        </div>
    );
};
