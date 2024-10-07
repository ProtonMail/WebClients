import { type UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { AddressesState } from '@proton/account';
import { addressesThunk } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { updateMember } from '@proton/shared/lib/api/calendars';
import { CALENDAR_DISPLAY } from '@proton/shared/lib/calendar/constants';
import { getMemberAndAddress } from '@proton/shared/lib/calendar/members';

import { type CalendarsState, calendarsActions, calendarsThunk } from './index';

export const changeCalendarVisiblity = ({
    calendarID,
    display,
}: {
    calendarID: string;
    display: boolean;
}): ThunkAction<Promise<void>, CalendarsState & AddressesState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const [calendars, addresses] = await Promise.all([dispatch(calendarsThunk()), dispatch(addressesThunk())]);
        const members = calendars.find(({ ID }) => ID === calendarID)?.Members || [];
        const [{ ID: memberID }] = getMemberAndAddress(addresses, members);

        dispatch(calendarsActions.updateCalendarVisibility({ calendarID, memberID, display }));

        try {
            extra.eventManager.stop();
            await extra.api(
                updateMember(calendarID, memberID, {
                    Display: display ? CALENDAR_DISPLAY.VISIBLE : CALENDAR_DISPLAY.HIDDEN,
                })
            );
        } catch (error) {
            dispatch(calendarsActions.updateCalendarVisibility({ calendarID, memberID, display: !display }));
        } finally {
            extra.eventManager.start();
        }
    };
};
