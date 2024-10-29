import { type UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { AddressesState, OrganizationState } from '@proton/account';
import { addressesThunk, organizationActions } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { updateMember } from '@proton/shared/lib/api/calendars';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
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
    return async (dispatch, _, extra) => {
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

export const toggleZoomSettings = ({
    checked,
}: {
    checked: boolean;
}): ThunkAction<Promise<void>, OrganizationState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        try {
            extra.eventManager.stop();
            dispatch(
                organizationActions.updateOrganizationSettings({
                    value: { VideoConferencingEnabled: checked },
                })
            );
            await extra.api(updateOrganizationSettings({ VideoConferencingEnabled: checked }));
        } catch (error) {
        } finally {
            extra.eventManager.start();
        }
    };
};
