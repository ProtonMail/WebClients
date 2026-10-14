import { useEffect } from 'react';

import { c } from 'ttag';

import { Table, TableBody } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { loadDashboard } from '../../logic/actions';
import { selectActiveImporterEntriesByDate } from '../../logic/importers/importers.selectors';
import { selectReportEntriesByDate } from '../../logic/reports/reports.selectors';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../logic/store';
import { useImporterOrganizations } from '../../oles/useImporterOrganizations';
import ImporterRow from './Importers/ImporterRow';
import OrganizationImportRow from './Organization/OrganizationImportRow';
import ReportRow from './Reports/ReportRow';
import ReportsTableInfos from './ReportsTableInfos';

const tableClassName = 'simple-table--border-weak simple-table--border-lines-rounded easy-switch-table';

const ImportsTable = () => {
    const reportEntries = useEasySwitchSelector(selectReportEntriesByDate);
    const activeImporterEntries = useEasySwitchSelector(selectActiveImporterEntriesByDate);
    const dispatch = useEasySwitchDispatch();
    const isDriveEnabled = useFlag('EasySwitchB2CForDriveWeb');

    const [organizationImports = []] = useImporterOrganizations();

    useEffect(() => {
        const request = dispatch(loadDashboard());
        return () => {
            request.abort();
        };
    }, []);

    return (
        <>
            {organizationImports.length > 0 && (
                <>
                    <h3 className="text-rg text-bold mb-2">{c('Title header').t`Organization migrations`}</h3>
                    <Table hasActions responsive="cards" className={tableClassName}>
                        <TableBody>
                            {organizationImports.map((io) => (
                                <OrganizationImportRow key={io.ImporterOrganizationID} importerOrganization={io} />
                            ))}
                        </TableBody>
                    </Table>
                    <h3 className="text-rg text-bold mb-2 mt-4">{c('Title header').t`Personal accounts`}</h3>
                </>
            )}

            <div className="mb-2 color-weak">
                {isDriveEnabled
                    ? c('Info')
                          .t`Import show one-time transfers of email, calendars, contacts, or files into your ${BRAND_NAME} account.`
                    : c('Info')
                          .t`Import show one-time transfers of email, calendars, or contacts into your ${BRAND_NAME} account.`}
            </div>
            {reportEntries.length === 0 && activeImporterEntries.length === 0 ? (
                <div className="color-weak">{c('Info').t`No import history.`}</div>
            ) : (
                <>
                    <ReportsTableInfos />
                    <Table hasActions responsive="cards" className={tableClassName}>
                        <TableBody>
                            {activeImporterEntries.map(({ activeImporter, importer }) => (
                                <ImporterRow
                                    key={activeImporter.localID}
                                    activeImporter={activeImporter}
                                    importer={importer}
                                />
                            ))}
                            {reportEntries.map(({ summary, report }) => (
                                <ReportRow key={summary.localID} reportSummary={summary} report={report} />
                            ))}
                        </TableBody>
                    </Table>
                </>
            )}
        </>
    );
};

export default ImportsTable;
