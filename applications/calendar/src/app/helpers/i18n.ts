import { c } from 'ttag';

import { VIEWS } from '@proton/shared/lib/calendar/constants';

const { DAY, WEEK, MONTH, YEAR, AGENDA, CUSTOM, MAIL, DRIVE, SEARCH } = VIEWS;

export const getNavigationArrowsText = (view: VIEWS) => {
    const dayText = {
        previous: c('Action').t`Previous day`,
        next: c('Action').t`Next day`,
    };
    const weekText = {
        previous: c('Action').t`Previous week`,
        next: c('Action').t`Next week`,
    };
    const monthText = {
        previous: c('Action').t`Previous month`,
        next: c('Action').t`Next month`,
    };
    const yearText = {
        previous: c('Action').t`Previous year`,
        next: c('Action').t`Next year`,
    };

    const previous = {
        [DAY]: dayText.previous,
        [WEEK]: weekText.previous,
        [MONTH]: monthText.previous,
        [AGENDA]: monthText.previous,
        [CUSTOM]: monthText.previous,
        [YEAR]: yearText.previous,
        [MAIL]: weekText.previous,
        [DRIVE]: weekText.previous,
        [SEARCH]: weekText.previous,
    };

    const next = {
        [DAY]: dayText.next,
        [WEEK]: weekText.next,
        [MONTH]: monthText.next,
        [AGENDA]: monthText.next,
        [CUSTOM]: monthText.next,
        [YEAR]: yearText.next,
        [MAIL]: weekText.next,
        [DRIVE]: weekText.next,
        [SEARCH]: weekText.next,
    };

    return {
        next: next[view],
        previous: previous[view],
    };
};
