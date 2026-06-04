import { useEffect } from 'react';

import { c } from 'ttag';

import { loadDashboard } from '@proton/activation/src/logic/actions';
import { selectActiveImporterIdsByDate } from '@proton/activation/src/logic/importers/importers.selectors';
import { selectReportSummaryIdsByDate } from '@proton/activation/src/logic/reports/reports.selectors';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { useImporterOrganizations } from '@proton/activation/src/oles/useImporterOrganizations';
import { Table, TableBody } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import ImporterRow from './Importers/ImporterRow';
import OrganizationImportRow from './Organization/OrganizationImportRow';
import ReportRow from './Reports/ReportRow';
import ReportsTableInfos from './ReportsTableInfos';

const tableClassName = 'simple-table--border-weak simple-table--border-lines-rounded easy-switch-table';

const ImportsTable = () => {
    const reportIds = useEasySwitchSelector(selectReportSummaryIdsByDate);
    const activeImporterIds = useEasySwitchSelector(selectActiveImporterIdsByDate);
    const dispatch = useEasySwitchDispatch();

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

            <div className="mb-2 color-weak">{c('Info')
                .t`Import show one-time transfers of email, calendars, or contacts into your ${BRAND_NAME} account.`}</div>
            {reportIds.length === 0 && activeImporterIds.length === 0 ? (
                <div className="color-weak">{c('Info').t`No import history.`}</div>
            ) : (
                <>
                    <ReportsTableInfos />
                    <Table hasActions responsive="cards" className={tableClassName}>
                        <TableBody>
                            {activeImporterIds.map((id) => (
                                <ImporterRow key={id} activeImporterId={id} />
                            ))}
                            {reportIds.map((id) => (
                                <ReportRow key={id} reportSummaryId={id} />
                            ))}
                        </TableBody>
                    </Table>
                </>
            )}
        </>
    );
};

export default ImportsTable;
