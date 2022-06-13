import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { SUPPORTED_VIEWS_IN_SIDE_APP } from '../containers/calendar/constants';
import { VIEW_URL_PARAMS_VIEWS_CONVERSION } from '../containers/calendar/getUrlHelper';

export const getIsSideApp = (view?: VIEWS) => {
    return view ? SUPPORTED_VIEWS_IN_SIDE_APP.includes(view) : false;
};

export const getViewString = (view?: VIEWS) => {
    if (!view) {
        return '';
    }
    return VIEW_URL_PARAMS_VIEWS_CONVERSION[view] || '';
};
