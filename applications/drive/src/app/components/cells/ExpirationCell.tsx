import { c } from 'ttag';

import { TableCell, TimeIntl, useActiveBreakpoint } from '@proton/components';
import { readableTime } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';

import { getPublicLinkIsExpired } from '../../utils/sdk/getPublicLinkIsExpired';

interface ExpirationCellProps {
    expirationTime: Date | undefined;
}

export const ExpirationCell = ({ expirationTime }: ExpirationCellProps) => {
    const { viewportWidth } = useActiveBreakpoint();

    const expiredPart = viewportWidth['>=large'] ? (
        <span className="ml-1">{c('Label').t`(Expired)`}</span>
    ) : (
        <span>{c('Label').t`Expired`}</span>
    );
    const isExpired = getPublicLinkIsExpired(expirationTime);

    const expiration = expirationTime ? (
        <div className="flex flex-nowrap">
            {(viewportWidth['>=large'] || !isExpired) && (
                <div
                    className="text-ellipsis"
                    title={readableTime(expirationTime.getTime(), { locale: dateLocale, format: 'PP' })}
                >
                    <span className="text-pre">
                        <TimeIntl
                            options={{
                                year: 'numeric',
                                day: 'numeric',
                                month: 'short',
                            }}
                        >
                            {expirationTime}
                        </TimeIntl>
                    </span>
                </div>
            )}
            {isExpired ? expiredPart : null}
        </div>
    ) : (
        c('Label').t`Never`
    );

    return (
        <TableCell className="flex items-center m-0 w-1/5" data-testid="column-share-expires">
            {expiration}
        </TableCell>
    );
};
