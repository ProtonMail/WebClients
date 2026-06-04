import { memo } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import type { ApiImporterOrganization } from '@proton/activation/src/api/api.interface';
import { ApiImporterOrganizationState } from '@proton/activation/src/api/api.interface';
import { ReportsTableIcon } from '@proton/activation/src/components/ReportsTable/ReportsTableIcon';
import { getImportProviderFromApiProvider } from '@proton/activation/src/helpers/getImportProviderFromApiProvider';
import { ImportType } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms/Button/Button';
import { TableCell, TableRow } from '@proton/components';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { IcArrowRight } from '@proton/icons/icons/IcArrowRight';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcClock } from '@proton/icons/icons/IcClock';
import { dateLocale } from '@proton/shared/lib/i18n';
import capitalize from '@proton/utils/capitalize';

interface Props {
    importerOrganization: ApiImporterOrganization;
}

const OrganizationImportRow = ({ importerOrganization }: Props) => {
    const goToSettings = useSettingsLink();

    const { Provider, DomainName, CreateTime, State } = importerOrganization;
    const company = capitalize(getImportProviderFromApiProvider(Provider));
    const createTime = Number(CreateTime);
    const isMigrated = State === ApiImporterOrganizationState.FINALIZED;

    return (
        <TableRow>
            <TableCell>
                <div className="flex">
                    <div className="shrink-0 mr-2 hidden md:flex">
                        <ReportsTableIcon provider={Provider} product={ImportType.MAIL} />
                    </div>
                    <div className="flex-1">
                        <div className="w-full text-ellipsis" title={DomainName}>
                            {DomainName}
                        </div>
                        <div className="color-weak">{company}</div>
                    </div>
                </div>
            </TableCell>
            <TableCell label={c('Title header').t`Date`} className="color-weak">
                {Number.isFinite(createTime) ? (
                    <time>{format(createTime * 1000, 'PPp', { locale: dateLocale })}</time>
                ) : (
                    '-'
                )}
            </TableCell>
            <TableCell className="easy-switch-table-status">
                {isMigrated ? (
                    <div className="inline-flex gap-2 color-success items-center">
                        <IcCheckmarkCircleFilled />
                        <span>{c('Import status').t`Migrated`}</span>
                    </div>
                ) : (
                    <div className="inline-flex gap-2 color-weak items-center">
                        <IcClock />
                        <span>{c('Import status').t`In progress`}</span>
                    </div>
                )}
            </TableCell>
            <TableCell className="easy-switch-table-actions">
                <Button
                    icon
                    shape="ghost"
                    onClick={() => goToSettings('/easy-switch/migration-assistant')}
                    title={c('Action').t`Manage migration`}
                >
                    <IcArrowRight />
                </Button>
            </TableCell>
        </TableRow>
    );
};

export default memo(OrganizationImportRow);
