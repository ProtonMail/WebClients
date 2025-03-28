import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { PROVIDER_INFO_MAP } from '@proton/pass/lib/import/types';
import { formatItemsCount } from '@proton/pass/lib/items/item.utils';
import { selectImportReport } from '@proton/pass/store/selectors';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const ImportReport: FC = () => {
    const { endpoint } = usePassCore();
    const report = useSelector(selectImportReport);

    if (!report) return null;

    const { ignored, ignoredFiles = [], warnings = [] } = report;
    const totalIgnored = ignored.length + ignoredFiles.length;
    const showResultDetails = totalIgnored > 0 || (warnings?.length ?? 0) > 0;

    const totalImportedItems = report.total;
    const totalItems = totalImportedItems + ignored.length;
    const totalFiles = report.totalFiles ?? 0;
    const totalImportedFiles = Math.max(0, (report?.totalFiles ?? 0) - ignoredFiles.length);

    return (
        report && (
            <SettingsPanel
                title={c('Label').t`Latest import`}
                subTitle={
                    report.error ? (
                        <span className="color-danger">{c('Error').t`An error occured during the import process`}</span>
                    ) : null
                }
            >
                <div className="flex flex-column gap-y-1 text-sm">
                    <div>
                        <span className="color-weak">{c('Label').t`Imported from: `}</span>
                        <span className="rounded bg-primary px-1 user-select-none">
                            {PROVIDER_INFO_MAP[report.provider].title}
                        </span>
                    </div>

                    <div>
                        <span className="color-weak">{c('Label').t`Imported on : `}</span>
                        <span>{new Date(report.importedAt * 1000).toLocaleString()}</span>
                    </div>

                    <div>
                        <span className="color-weak">{c('Label').t`Total items: `}</span>
                        <span>{formatItemsCount(totalItems)}</span>
                    </div>

                    <div>
                        <span className="color-weak">{c('Label').t`Total imported items: `}</span>
                        <span>{formatItemsCount(totalImportedItems)}</span>
                    </div>

                    {totalFiles > 0 && (
                        <>
                            <div>
                                <span className="color-weak">{c('Label').t`Total files: `}</span>
                                <span>{formatItemsCount(totalFiles)}</span>
                            </div>

                            <div>
                                <span className="color-weak">{c('Label').t`Total imported files: `}</span>
                                <span>{formatItemsCount(totalImportedFiles ?? 0)}</span>
                            </div>
                        </>
                    )}

                    {showResultDetails && (
                        <div className="bg-norm rounded-sm p-3 mt-2 w-full">
                            {totalIgnored > 0 && (
                                <span className="mb-2 block">
                                    {c('Info').ngettext(
                                        msgid`The following ${report.ignored.length} item could not be imported:`,
                                        `The following ${report.ignored.length} items could not be imported:`,
                                        report.ignored.length
                                    )}
                                </span>
                            )}
                            <div className="color-weak overflow-auto" style={{ maxHeight: 150 }}>
                                {ignored.map((description, idx) => (
                                    <span className="block text-ellipsis" key={`ignored-${idx}`}>
                                        {description}
                                    </span>
                                ))}

                                {ignoredFiles.map((filename, idx) => (
                                    <span className="block text-ellipsis" key={`ignored-${idx}`}>
                                        [{c('Label').t`File`}] {filename}
                                    </span>
                                ))}

                                {warnings.map((warning, idx) => (
                                    <span className="block text-ellipsis" key={`warning-${idx}`}>
                                        {warning}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {endpoint === 'page' && (
                        <div className="mt-2">
                            {c('Info')
                                .t`To review your imported data, click on the ${PASS_APP_NAME} icon in your browser toolbar.`}
                        </div>
                    )}
                </div>
            </SettingsPanel>
        )
    );
};
