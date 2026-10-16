import { c } from 'ttag';

import {
    getImporterString,
    getSummaryString,
} from '@proton/activation/src/components/ReportsTable/Reports/reportStrings';
import { formatReportDate } from '@proton/activation/src/components/ReportsTable/formatReportDate';
import { selectActiveImporterEntriesByDate } from '@proton/activation/src/logic/importers/importers.selectors';
import { selectReportEntriesByDate } from '@proton/activation/src/logic/reports/reports.selectors';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { ConnectionsSection } from './ConnectionsSection';
import { ConnectionSectionStringContent, ConnectionsSectionRow } from './ConnectionsSectionRow';
import { ImporterActions } from './ImporterActions';
import { ReportActions } from './ReportActions';

export const BYOEImports = () => {
    const reportEntries = useEasySwitchSelector(selectReportEntriesByDate);
    const activeImporterEntries = useEasySwitchSelector(selectActiveImporterEntriesByDate);

    if (reportEntries.length === 0 && activeImporterEntries.length === 0) {
        return null;
    }

    return (
        <ConnectionsSection title={c('Title').t`Imports`}>
            {activeImporterEntries.map((entry) => (
                <ConnectionsSectionRow key={entry.activeImporter.importerID} apiProvider={entry.importer.provider}>
                    <ConnectionSectionStringContent
                        firstLine={entry.importer.account}
                        secondLine={getImporterString(entry.activeImporter.importState)}
                    />
                    <ImporterActions activeImporter={entry.activeImporter} importer={entry.importer} />
                </ConnectionsSectionRow>
            ))}
            {reportEntries.map((entry) => {
                const readableSize = humanSize({ bytes: entry.report.size });
                const reportString = getSummaryString(entry.summary);
                const formattedDate = formatReportDate(entry.report.endDate);

                return (
                    <ConnectionsSectionRow key={entry.summary.localID} apiProvider={entry.report.provider}>
                        <ConnectionSectionStringContent
                            firstLine={entry.report.account}
                            secondLine={[reportString, formattedDate, readableSize].filter(Boolean).join(' · ')}
                        />
                        <ReportActions summary={entry.summary} report={entry.report} />
                    </ConnectionsSectionRow>
                );
            })}
        </ConnectionsSection>
    );
};
