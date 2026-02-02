import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import clsx from '@proton/utils/clsx';

import type { CellDefinition } from '../../../statelessComponents/DriveExplorer/types';

export interface DownloadCellProps {
    uid: string;
    onDownload: (uid: string) => void;
    className?: string;
}

export const DownloadCell = ({ uid, onDownload, className }: DownloadCellProps) => {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDownload(uid);
    };

    const buttonClassName = clsx(['self-center my-auto', 'mouse:group-hover:opacity-100', className]);

    return (
        <Button className={buttonClassName} shape="ghost" size="small" onClick={handleClick}>
            <span>{c('Action').t`Download`}</span>
            <IcArrowDownLine className="ml-2 md:hidden lg:inline" />
        </Button>
    );
};

export const defaultDownloadCellConfig: Omit<CellDefinition, 'render'> = {
    id: 'download',
    className: 'flex justify-end w-1/6',
    testId: 'column-download',
};
