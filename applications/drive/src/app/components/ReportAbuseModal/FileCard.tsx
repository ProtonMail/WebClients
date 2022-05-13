import React from 'react';
import { FileIcon, FileNameDisplay, classnames } from '@proton/components';

import SizeCell from '../FileBrowser/ListView/Cells/SizeCell';
import { LinkInfo } from './types';

interface Props {
    linkInfo: LinkInfo;
    className?: string;
}

export const FileCard = ({ linkInfo, className }: Props) => {
    return (
        <div
            className={classnames([
                'flex',
                'flex-nowrap',
                'rounded',
                'border',
                'p1',
                'flex-align-items-center',
                className,
            ])}
        >
            <div className="flex flex-column flex-nowrap bg-grey mr1 flex-item-noshrink">
                <FileIcon size={28} mimeType={linkInfo.mimeType} alt={linkInfo.name} />
            </div>
            <div className="flex flex-column flex-nowrap">
                <div className="text-bold mw100 flex w100">
                    <FileNameDisplay text={linkInfo.name} />
                </div>
                {linkInfo.mimeType !== 'Folder' && <SizeCell size={linkInfo.size} />}
            </div>
        </div>
    );
};
