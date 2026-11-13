import { c } from 'ttag';

import { ApiImporterError } from '@proton/activation/src/api/api.interface';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import MiddleEllipsis from '@proton/components/components/ellipsis/MiddleEllipsis';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';

import type { ImportingFolder } from '../getImportingFolders';

const getImportTooltipLines = ({ importedBytes, pausedImport }: ImportingFolder) => {
    if (pausedImport?.errorCode === ApiImporterError.ERROR_CODE_IMAP_CONNECTION) {
        return [c('Info').t`Import interrupted`, c('Info').t`Reconnect Google Drive`];
    }
    if (pausedImport) {
        return [c('Info').t`Import paused`, c('Info').t`More storage needed`];
    }
    const importedSize = humanSize({ bytes: importedBytes });
    return [c('Info').t`Importing from Google Drive…`, c('Info').t`${importedSize} imported`];
};

interface Props {
    name: string;
    importingFolder: ImportingFolder;
}

export const ImportNameCell = ({ name, importingFolder }: Props) => {
    const [title, detail] = getImportTooltipLines(importingFolder);

    return (
        <span className="flex items-center flex-nowrap mr-4" aria-label={name}>
            <Tooltip
                title={
                    <>
                        {title}
                        <br />
                        {detail}
                    </>
                }
            >
                <span className="flex shrink-0 mr-2 relative z-up">
                    {importingFolder.pausedImport ? (
                        <IcExclamationCircleFilled className="color-danger" data-testid="import-error-icon" />
                    ) : (
                        <CircleLoader className="icon-size-4 color-primary" />
                    )}
                </span>
            </Tooltip>
            <MiddleEllipsis
                charsToDisplayEnd={0}
                text={rtlSanitize(name)}
                displayTitle={false}
                displayTooltip
                data-testid="name-cell"
                splitOnlyTooLong
            />
        </span>
    );
};
