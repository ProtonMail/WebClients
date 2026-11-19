import { c } from 'ttag';

import { ApiImporterError } from '@proton/activation/src/api/api.interface';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import MiddleEllipsis from '@proton/components/components/ellipsis/MiddleEllipsis';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import type { ImportingFolder } from '../getImportingFolders';

const getImportTooltipLines = ({ importedBytes, pausedImport }: ImportingFolder) => {
    if (pausedImport?.errorCode === ApiImporterError.ERROR_CODE_IMAP_CONNECTION) {
        return [c('Info').t`Import interrupted`, c('Info').t`Reconnect Google Drive`];
    }
    if (pausedImport) {
        return [c('Info').t`Import paused`, c('Info').t`More storage needed`];
    }
    if (!importedBytes) {
        return [c('Info').t`Importing from Google Drive…`];
    }
    const importedSize = humanSize({ bytes: importedBytes });
    return [c('Info').t`Importing from Google Drive…`, c('Info').t`${importedSize} imported`];
};

interface ImportStatusIconProps {
    importingFolder: ImportingFolder;
    size: 4 | 12;
    className?: string;
}

export const ImportStatusIcon = ({ importingFolder, size, className }: ImportStatusIconProps) => {
    const [title, detail] = getImportTooltipLines(importingFolder);

    return (
        <Tooltip
            title={
                <>
                    {title}
                    {detail && (
                        <>
                            <br />
                            {detail}
                        </>
                    )}
                </>
            }
        >
            <span className={clsx('flex shrink-0', className)}>
                {importingFolder.pausedImport ? (
                    <IcExclamationCircleFilled size={size} className="color-danger" data-testid="import-error-icon" />
                ) : (
                    <CircleLoader className={`icon-size-${size} color-primary`} />
                )}
            </span>
        </Tooltip>
    );
};

interface Props {
    importingFolder: ImportingFolder;
}

export const ImportNameCell = ({ importingFolder }: Props) => {
    const { name } = importingFolder;

    return (
        <span className="flex items-center flex-nowrap mr-4" aria-label={name}>
            {/* Above the row's click area so the tooltip shows on hover. */}
            <ImportStatusIcon importingFolder={importingFolder} size={4} className="mr-2 relative z-up" />
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
