import { c, msgid } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props {
    canMerge: boolean;
    calendarToFixCount: number;
}

const CustomizeCalendarImportModalLimitReached = ({ canMerge, calendarToFixCount }: Props) => {
    return (
        <div
            className="rounded-lg p1 mb1 bg-danger color-white text-semibold border-none"
            data-testid="CustomizeCalendarImportModalLimitReached:container"
        >
            {c('Error')
                .t`You have reached the maximum number of personal calendars. Some calendars couldn't be imported.`}
            <ul className="m0">
                <li>
                    {canMerge
                        ? c('Error').ngettext(
                              msgid`Deselect at least ${calendarToFixCount} calendar or`,
                              `Deselect at least ${calendarToFixCount} calendars or`,
                              calendarToFixCount
                          )
                        : c('Error').ngettext(
                              msgid`Deselect at least ${calendarToFixCount} calendar`,
                              `Deselect at least ${calendarToFixCount} calendars`,
                              calendarToFixCount
                          )}
                </li>
                {canMerge && (
                    <li>
                        {c('Error').ngettext(
                            msgid`Merge at least ${calendarToFixCount} calendar with an existing ${BRAND_NAME} calendar`,
                            `Merge at least ${calendarToFixCount} calendars with existing ${BRAND_NAME} calendars`,
                            calendarToFixCount
                        )}
                    </li>
                )}
            </ul>
        </div>
    );
};

export default CustomizeCalendarImportModalLimitReached;
