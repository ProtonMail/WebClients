import { c } from 'ttag';

import {
    ImportStatus,
    ImportError,
    ImportReport,
    ImportType,
    Importer,
    NormalizedImporter,
} from '@proton/shared/lib/interfaces/EasySwitch';

import { useImporters, useImportReports } from '../../hooks';
import { Href, Alert, Loader, Table, TableCell, TableBody } from '../../components';

import { SettingsParagraph, SettingsSectionWide } from '../account';

import { ImportHistory } from './mail/interfaces';

import ActiveImportRow from './list/ActiveImportRow';
import ImportReportRow from './list/ImportReportRow';

const sortActiveImports = (a: NormalizedImporter, b: NormalizedImporter) => {
    if (!a.Active || !b.Active) {
        return 0;
    }

    return a.Active.CreateTime > b.Active.CreateTime ? -1 : 1;
};

const sortImportReports = (a: ImportReport | ImportHistory, b: ImportReport | ImportHistory) =>
    a.EndTime > b.EndTime ? -1 : 1;

const ImportListSection = () => {
    const [imports = [], importsLoading] = useImporters();
    const [aggregatedPastImports = [], pastImportsLoading] = useImportReports();

    const pastImports = aggregatedPastImports.reduce<ImportReport[]>((acc, aggregatedReport) => {
        const reports: ImportReport[] = [];

        const { ID, Account, Provider, TokenID, CreateTime, EndTime, Summary } = aggregatedReport;

        const commonValues = {
            ID,
            Account,
            Provider,
            TokenID,
            CreateTime,
            EndTime,
        };

        if (Summary.Mail) {
            reports.push({
                ...commonValues,
                Product: ImportType.MAIL,
                NumItems: Summary.Mail.NumMessages,
                State: Summary.Mail.State,
                TotalSize: Summary.Mail.TotalSize,
            });
        }
        if (Summary.Calendar) {
            reports.push({
                ...commonValues,
                Product: ImportType.CALENDAR,
                NumItems: Summary.Calendar.NumEvents,
                State: Summary.Calendar.State,
                TotalSize: Summary.Calendar.TotalSize,
            });
        }
        if (Summary.Contacts) {
            reports.push({
                ...commonValues,
                Product: ImportType.CONTACTS,
                NumItems: Summary.Contacts.NumContacts,
                State: Summary.Contacts.State,
                TotalSize: Summary.Contacts.TotalSize,
            });
        }

        return [...acc, ...reports];
    }, []);

    const activeImports = imports.reduce<NormalizedImporter[]>((acc, aggregatedImporter: Importer) => {
        const imports: NormalizedImporter[] = [];

        const { ID, TokenID, Account, Provider, Product, ImapHost, ImapPort, Sasl, AllowSelfSigned, Email, Active } =
            aggregatedImporter;

        const commonValues = {
            ID,
            TokenID,
            Account,
            Provider,
            ImapHost,
            ImapPort,
            Sasl,
            AllowSelfSigned,
            Email,
            tokenScope: Product,
        };

        if (!Active) {
            return acc;
        }

        if (Active.Mail) {
            imports.push({
                ...commonValues,
                Active: Active.Mail,
                Product: ImportType.MAIL,
            });
        }
        if (Active.Calendar) {
            imports.push({
                ...commonValues,
                Active: Active.Calendar,
                Product: ImportType.CALENDAR,
            });
        }
        if (Active.Contacts) {
            imports.push({
                ...commonValues,
                Active: Active.Contacts,
                Product: ImportType.CONTACTS,
            });
        }

        return [...acc, ...imports];
    }, []);

    const isLoading = importsLoading || pastImportsLoading;

    if (!isLoading && !activeImports.length && !pastImports.length) {
        return <SettingsParagraph>{c('Info').t`No imports to display.`}</SettingsParagraph>;
    }

    const hasStoragePausedImports = activeImports.some(({ Active }) => {
        return Active?.State === ImportStatus.PAUSED && Active?.ErrorCode === ImportError.ERROR_CODE_QUOTA_LIMIT;
    });

    const hasAuthPausedImports = activeImports.some(({ Active }) => {
        return Active?.State === ImportStatus.PAUSED && Active?.ErrorCode === ImportError.ERROR_CODE_IMAP_CONNECTION;
    });

    const delayedImport = activeImports.find(({ Active }) => {
        return Active?.State === ImportStatus.DELAYED;
    });

    const headerCells = [
        { key: 'import', node: c('Title header').t`Import` },
        { key: 'status', node: c('Title header').t`Status`, className: 'on-mobile-w33 on-mobile-text-center' },
        { key: 'date', node: c('Title header').t`Date`, className: 'no-mobile' },
        { key: 'size', node: c('Title header').t`Size`, className: 'no-mobile' },
        { key: 'actions', node: c('Title header').t`Actions` },
    ].map(({ node, key, className = '' }) => {
        return (
            <TableCell key={key} className={className} type="header">
                {node}
            </TableCell>
        );
    });

    const bandwithLimitLink = (
        <Href
            key="bandwithLimitLink"
            url="https://protonmail.com/support/knowledge-base/import-assistant/#delayed-import"
        >
            {c('Import error link').t`bandwidth limit`}
        </Href>
    );

    // translator: the variable here is a HTML tag, here is the complete sentence: "Proton will try to resume the import as soon as your email provider resets your account’s bandwidth limit. You don’t need to do anything. If you cancel your import, you won't be able to resume it and you will need to start over."
    const bandwidthMessage = c('Info')
        .jt`Proton will try to resume the import as soon as your email provider resets your account’s ${bandwithLimitLink}. You don’t need to do anything. If you cancel your import, you won't be able to resume it and you will need to start over.`;

    const infoRenderer = () => {
        if (!hasAuthPausedImports) {
            return (
                <SettingsParagraph>{c('Info').t`Check the status of current and previous imports.`}</SettingsParagraph>
            );
        }

        if (hasStoragePausedImports) {
            return (
                <Alert className="mb1" type="warning">
                    {c('Info').t`Proton paused an import because your account is running low on space. You can:`}
                    <ul className="m0">
                        <li>{c('Info').t`free up space by deleting older messages or other data`}</li>
                        <li>{c('Info').t`purchase additional storage`}</li>
                    </ul>
                </Alert>
            );
        }

        if (hasAuthPausedImports) {
            return (
                <Alert className="mb1" type="warning">
                    {c('Info')
                        .t`Proton paused an import because it lost the connection with your other email provider. Please reconnect.`}
                </Alert>
            );
        }

        if (delayedImport) {
            return (
                <Alert className="mb1" type="warning">
                    {c('Info').t`Your import from ${delayedImport.Account} is temporarily delayed.`}
                    <br />
                    {bandwidthMessage}
                </Alert>
            );
        }
    };

    return (
        <SettingsSectionWide>
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    {infoRenderer()}
                    <Table className="on-mobile-hide-td3 on-mobile-hide-td4 simple-table--has-actions">
                        <thead>
                            <tr>{headerCells}</tr>
                        </thead>
                        <TableBody>
                            {activeImports.sort(sortActiveImports).map((activeImport) => (
                                <ActiveImportRow
                                    key={`${activeImport.ID}-${activeImport.Product}`}
                                    activeImport={activeImport}
                                />
                            ))}
                            {pastImports.sort(sortImportReports).map((report) => (
                                <ImportReportRow key={`${report.ID}-${report.Product}`} report={report} />
                            ))}
                        </TableBody>
                    </Table>
                </>
            )}
        </SettingsSectionWide>
    );
};

export default ImportListSection;
