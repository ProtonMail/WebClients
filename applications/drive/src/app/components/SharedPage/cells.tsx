import { c } from 'ttag';

import { TableCell, FileIcon, Icon, Loader } from '@proton/components';

import { Cells, HeaderCellsPresets } from '../FileBrowser';
import { getLinkIconText } from '../sections/FileBrowser/utils';
import { PublicLink } from './interface';

export const headerCells = [
    {
        type: HeaderCellsPresets.Checkbox,
    },
    {
        type: 'name',
        text: c('Label').t`Name`,
        sorting: true,
    },
    {
        type: 'size',
        text: c('Label').t`Size`,
        props: {
            className: 'w20',
        },
        sorting: true,
    },
];

export const contentCells: React.FC<{ item: PublicLink }>[] = [Cells.CheckboxCell, NameCell, SizeCell];

function NameCell({ item }: { item: PublicLink }) {
    const iconText = getLinkIconText({
        linkName: item.name,
        mimeType: item.mimeType,
        isFile: item.isFile,
    });

    return (
        <TableCell className="m0 flex flex-align-items-center flex-nowrap flex-item-fluid" data-testid="column-name">
            <FileIcon mimeType={item.isFile ? item.mimeType : 'Folder'} alt={iconText} className="mr0-5" />
            <Cells.NameCell name={item.name} />
        </TableCell>
    );
}

function SizeCell({ item }: { item: PublicLink }) {
    if (item.progress) {
        // Yes, when progress is ongoing, the size is wider than normal size cell,
        // including the header. This is wanted UI element.
        return (
            <TableCell className="m0 w35 flex flex-nowrap flex-justify-end" data-testid="column-size">
                <Cells.SizeCell size={item.progress.progress} />/
                {item.progress.total !== undefined ? <Cells.SizeCell size={item.progress.total} /> : '-'}
                {item.progress.isFinished ? <Icon name="checkmark" className="ml0-5" /> : <Loader className="ml0-5" />}
            </TableCell>
        );
    }
    return (
        <TableCell className="m0 w20 flex flex-nowrap" data-testid="column-size">
            {item.isFile ? <Cells.SizeCell size={item.size} /> : '-'}
        </TableCell>
    );
}
