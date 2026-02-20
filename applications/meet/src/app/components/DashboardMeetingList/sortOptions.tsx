import { formatInTimeZone } from 'date-fns-tz';
import { c } from 'ttag';

import { IcCalendarCheckmark } from '@proton/icons/icons/IcCalendarCheckmark';
import { IcCalendarToday } from '@proton/icons/icons/IcCalendarToday';
import { IcClock } from '@proton/icons/icons/IcClock';
import type { SETTINGS_DATE_FORMAT } from '@proton/shared/lib/interfaces';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

import type { SortOptionObject } from './types';
import { SortOption } from './types';
import { formatMeetingDate } from './utils';

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const getCreatedOnSubtitle = (meeting: Meeting, dateFormat: SETTINGS_DATE_FORMAT) => {
    const formattedDate = formatMeetingDate(
        formatInTimeZone(1000 * meeting.CreateTime, userTimezone, 'yyyy-MM-dd'),
        dateFormat
    );
    return c('Info').t`Created on ${formattedDate}`;
};

export const getSortOptions = (isPastMeetingsEnabled: boolean): SortOptionObject[] => [
    {
        value: SortOption.NewlyCreated,
        label: c('Sort option').t`Newly created`,
        icon: <IcClock className="shrink-0 mr-2" />,
        groupBy: 'CreateTime',
        getSubtitle: getCreatedOnSubtitle,
    },
    {
        value: SortOption.Upcoming,
        label: c('Sort option').t`Upcoming`,
        icon: <IcCalendarToday className="shrink-0 mr-2" />,
        groupBy: 'adjustedStartTime',
        getSubtitle: getCreatedOnSubtitle,
    },
    ...(isPastMeetingsEnabled
        ? [
              {
                  value: SortOption.Past,
                  label: c('Sort option').t`Past meetings`,
                  icon: <IcCalendarCheckmark className="shrink-0 mr-2" />,
                  groupBy: 'adjustedEndTime',
                  getSubtitle: getCreatedOnSubtitle,
              } as SortOptionObject,
          ]
        : []),
];
