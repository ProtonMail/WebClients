import { c } from 'ttag';

import { VIEWS } from '@proton/shared/lib/calendar/constants';

const { DAY, WEEK, MONTH, YEAR, AGENDA, CUSTOM, MAIL, DRIVE } = VIEWS;

export const getNavigationArrowsText = (view: VIEWS) => {
    const previous = {
        [DAY]: c('Action').t`Previous day`,
        [WEEK]: c('Action').t`Previous week`,
        [MONTH]: c('Action').t`Previous month`,
        [AGENDA]: c('Action').t`Previous month`,
        [CUSTOM]: c('Action').t`Previous month`,
        [YEAR]: c('Action').t`Previous year`,
        [MAIL]: c('Action').t`Previous week`,
        [DRIVE]: c('Action').t`Previous week`,
    };

    const next = {
        [DAY]: c('Action').t`Next day`,
        [WEEK]: c('Action').t`Next week`,
        [MONTH]: c('Action').t`Next month`,
        [AGENDA]: c('Action').t`Next month`,
        [CUSTOM]: c('Action').t`Next month`,
        [YEAR]: c('Action').t`Next year`,
        [MAIL]: c('Action').t`Next week`,
        [DRIVE]: c('Action').t`Next week`,
    };

    return {
        next: next[view],
        previous: previous[view],
    };
};
