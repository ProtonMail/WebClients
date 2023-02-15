import { memo } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { ActiveImportID } from '@proton/activation/src/logic/importers/importers.interface';
import {
    selectActiveImporterById,
    selectImporterById,
} from '@proton/activation/src/logic/importers/importers.selectors';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { TableCell, TableRow } from '@proton/components';
import { dateLocale } from '@proton/shared/lib/i18n';

import ReportsTableCell from '../ReportsTableCell';
import { getActiveImporterProgress } from './ImporterRow.helpers';
import ImporterRowActions from './ImporterRowActions';
import ImporterRowStatus from './ImporterRowStatus';

interface Props {
    activeImporterId: ActiveImportID;
}

const ImporterRow = ({ activeImporterId }: Props) => {
    const activeImporter = useEasySwitchSelector((state) => selectActiveImporterById(state, activeImporterId));
    const importer = useEasySwitchSelector((state) => selectImporterById(state, activeImporter.importerID));

    const { product, importState, startDate, errorCode } = activeImporter;
    const { account } = importer;
    const processedState = getActiveImporterProgress(activeImporter);

    return (
        <TableRow>
            <ReportsTableCell product={product} title={account} />
            <TableCell>
                <div>
                    <ImporterRowStatus
                        processed={processedState.processed}
                        total={processedState.total}
                        state={importState}
                        errorCode={errorCode}
                    />
                </div>
            </TableCell>
            <TableCell>
                <time>{format(startDate * 1000, 'PPp', { locale: dateLocale })}</time>
            </TableCell>
            <TableCell label={c('Title header').t`Size`}>{'-'}</TableCell>
            <TableCell>
                <ImporterRowActions activeImporterID={activeImporter.localID} />
            </TableCell>
        </TableRow>
    );
};

export default memo(ImporterRow);
