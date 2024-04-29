import { c, msgid } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props {
    canMerge: boolean;
    calendarsToFixCount: number;
}

const CustomizeCalendarImportModalLimitReached = ({ canMerge, calendarsToFixCount }: Props) => {
    return (
        <div
            className="rounded-lg p-4 mb-4 bg-danger color-white text-semibold border-none"
            data-testid="CustomizeCalendarImportModalLimitReached:container"
        >
            {c('Error').t`You have reached the maximum number of calendars.`}
            <ul className="m-0">
                <li>
                    {canMerge
                        ? c('Error').ngettext(
                              msgid`Deselect at least ${calendarsToFixCount} calendar or`,
                              `Deselect at least ${calendarsToFixCount} calendars or`,
                              calendarsToFixCount
                          )
                        : c('Error').ngettext(
                              msgid`Deselect at least ${calendarsToFixCount} calendar`,
                              `Deselect at least ${calendarsToFixCount} calendars`,
                              calendarsToFixCount
                          )}
                </li>
                {canMerge && (
                    <li>
                        {c('Error').ngettext(
                            msgid`Merge at least ${calendarsToFixCount} calendar with an existing ${BRAND_NAME} calendar`,
                            `Merge at least ${calendarsToFixCount} calendars with existing ${BRAND_NAME} calendars`,
                            calendarsToFixCount
                        )}
                    </li>
                )}
            </ul>
        </div>
    );
};

export default CustomizeCalendarImportModalLimitReached;
