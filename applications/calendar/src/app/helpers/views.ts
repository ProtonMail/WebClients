import type { VIEWS } from '@proton/shared/lib/calendar/constants';

import { SUPPORTED_VIEWS_IN_DRAWER } from '../containers/calendar/constants';

export const getIsCalendarAppInDrawer = (view?: VIEWS) => {
    return view ? SUPPORTED_VIEWS_IN_DRAWER.includes(view) : false;
};
