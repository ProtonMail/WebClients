import { memo } from 'react';

import { c } from 'ttag';

import type { ActiveImportID } from '@proton/activation/src/logic/importers/importers.interface';
import {
    selectActiveImporterById,
    selectImporterById,
} from '@proton/activation/src/logic/importers/importers.selectors';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { TableCell, TableRow } from '@proton/components';

import ReportsTableCell from '../ReportsTableCell';
import ImporterRowActions from './ImporterRowActions';
import ImporterRowStatus from './ImporterRowStatus';

interface Props {
    activeImporterId: ActiveImportID;
}

const ImporterRow = ({ activeImporterId }: Props) => {
    const activeImporter = useEasySwitchSelector((state) => selectActiveImporterById(state, activeImporterId));
    const importer = useEasySwitchSelector((state) => selectImporterById(state, activeImporter.importerID));

    const { product, importState, startDate, errorCode } = activeImporter;
    const { account, provider } = importer;

    return (
        <TableRow>
            <ReportsTableCell provider={provider} product={product} title={account} importerDate={startDate} />
            <TableCell className="easy-switch-table-size" label={c('Title header').t`Size`}>
                {'-'}
            </TableCell>
            <TableCell className="easy-switch-table-status">
                <div>
                    <ImporterRowStatus state={importState} errorCode={errorCode} />
                </div>
            </TableCell>
            <TableCell className="easy-switch-table-actions">
                <ImporterRowActions activeImporterID={activeImporter.localID} />
            </TableCell>
        </TableRow>
    );
};

export default memo(ImporterRow);
