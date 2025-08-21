import { c } from 'ttag';

import { VIEWS } from '@proton/shared/lib/calendar/constants';

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
        [VIEWS.DAY]: dayText.previous,
        [VIEWS.WEEK]: weekText.previous,
        [VIEWS.MONTH]: monthText.previous,
        [VIEWS.AGENDA]: monthText.previous,
        [VIEWS.CUSTOM]: monthText.previous,
        [VIEWS.YEAR]: yearText.previous,
        [VIEWS.MAIL]: weekText.previous,
        [VIEWS.DRIVE]: weekText.previous,
        [VIEWS.SEARCH]: weekText.previous,
    };

    const next = {
        [VIEWS.DAY]: dayText.next,
        [VIEWS.WEEK]: weekText.next,
        [VIEWS.MONTH]: monthText.next,
        [VIEWS.AGENDA]: monthText.next,
        [VIEWS.CUSTOM]: monthText.next,
        [VIEWS.YEAR]: yearText.next,
        [VIEWS.MAIL]: weekText.next,
        [VIEWS.DRIVE]: weekText.next,
        [VIEWS.SEARCH]: weekText.next,
    };

    return {
        next: next[view],
        previous: previous[view],
    };
};
