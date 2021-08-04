import { c } from 'ttag';

import { useImporters, useImportHistory } from '../../../hooks';
import { Loader, Alert, Table, TableBody, TableCell, Href } from '../../../components';

import { SettingsParagraph, SettingsSectionWide } from '../../account';
import ImportListRow from './list/ImportListRow';
import { Importer, ImportHistory, ImportMailStatus, ImportMailError } from './interfaces';

const sortActiveImports = (a: Importer, b: Importer) => {
    if (!a.Active || !b.Active) {
        return 0;
    }

    return a.Active.CreateTime > b.Active.CreateTime ? -1 : 1;
};

const sortPastImports = (a: ImportHistory, b: ImportHistory) => (a.EndTime > b.EndTime ? -1 : 1);

const ImportListSection = () => {
    const [imports = [], importsLoading] = useImporters();
    const [pastImports = [], pastImportsLoading] = useImportHistory();

    const activeImports = imports.filter(({ Active }) => Active);

    const isLoading = importsLoading || pastImportsLoading;

    if (!isLoading && !activeImports.length && !pastImports.length) {
        return <SettingsParagraph>{c('Info').t`No imports to display.`}</SettingsParagraph>;
    }

    const hasStoragePausedImports = imports.some(({ Active }) => {
        return (
            Active?.State === ImportMailStatus.PAUSED && Active?.ErrorCode === ImportMailError.ERROR_CODE_QUOTA_LIMIT
        );
    });

    const hasAuthPausedImports = imports.some(({ Active }) => {
        return (
            Active?.State === ImportMailStatus.PAUSED &&
            Active?.ErrorCode === ImportMailError.ERROR_CODE_IMAP_CONNECTION
        );
    });

    const delayedImport = imports.find(({ Active }) => {
        return Active?.State === ImportMailStatus.DELAYED;
    });

    const headerCells = [
        { key: 'import', node: c('Title header').t`Import` },
        { key: 'status', node: c('Title header').t`Status`, className: 'on-mobile-w33 on-mobile-text-center' },
        { key: 'date', node: c('Title header').t`Date`, className: 'no-mobile' },
        { key: 'size', node: c('Title header').t`Size`, className: 'no-mobile' },
        { key: 'actions', node: c('Title header').t`Actions`, className: 'no-mobile' },
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
                <Alert type="warning">
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
                <Alert type="warning">
                    {c('Info')
                        .t`Proton paused an import because it lost the connection with your other email provider. Please reconnect.`}
                </Alert>
            );
        }

        if (delayedImport) {
            return (
                <Alert type="warning">
                    {c('Info').t`Your import from ${delayedImport.Email} is temporarily delayed.`}
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
                            {[...activeImports.sort(sortActiveImports), ...pastImports.sort(sortPastImports)].map(
                                (currentImport) => (
                                    <ImportListRow key={currentImport.ID} currentImport={currentImport} />
                                )
                            )}
                        </TableBody>
                    </Table>
                </>
            )}
        </SettingsSectionWide>
    );
};

export default ImportListSection;
