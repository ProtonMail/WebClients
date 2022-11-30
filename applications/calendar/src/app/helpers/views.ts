import { VIEWS } from '@proton/shared/lib/calendar/constants';

import { SUPPORTED_VIEWS_IN_DRAWER } from '../containers/calendar/constants';
import { VIEW_URL_PARAMS_VIEWS_CONVERSION } from '../containers/calendar/getUrlHelper';

export const getIsCalendarAppInDrawer = (view?: VIEWS) => {
    return view ? SUPPORTED_VIEWS_IN_DRAWER.includes(view) : false;
};

export const getViewString = (view?: VIEWS) => {
    if (!view) {
        return '';
    }
    return VIEW_URL_PARAMS_VIEWS_CONVERSION[view] || '';
};
