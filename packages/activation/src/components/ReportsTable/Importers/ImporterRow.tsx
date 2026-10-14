import { memo } from 'react';

import { c } from 'ttag';

import { TableCell, TableRow } from '@proton/components';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';

import type { ActiveImporter, Importer } from '../../../logic/importers/importers.interface';
import ReportsTableCell from '../ReportsTableCell';
import ImporterRowActions from './ImporterRowActions';
import ImporterRowStatus from './ImporterRowStatus';

interface Props {
    activeImporter: ActiveImporter;
    importer: Importer;
}

const ImporterRow = ({ activeImporter, importer }: Props) => {
    const { product, importState, startDate, errorCode, importedBytes } = activeImporter;
    const { account, provider } = importer;

    return (
        <TableRow>
            <ReportsTableCell provider={provider} product={product} title={account} importerDate={startDate} />
            <TableCell className="easy-switch-table-size" label={c('Title header').t`Size`}>
                {importedBytes !== undefined ? shortHumanSize(importedBytes) : '-'}
            </TableCell>
            <TableCell className="easy-switch-table-status">
                <div>
                    <ImporterRowStatus state={importState} errorCode={errorCode} />
                </div>
            </TableCell>
            <TableCell className="easy-switch-table-actions">
                <ImporterRowActions activeImporter={activeImporter} importer={importer} />
            </TableCell>
        </TableRow>
    );
};

export default memo(ImporterRow);
