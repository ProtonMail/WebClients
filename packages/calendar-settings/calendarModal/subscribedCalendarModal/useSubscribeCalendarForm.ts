import { useState } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import useLoading from '@proton/hooks/useLoading';
import { validateSubscription } from '@proton/shared/lib/api/calendars';
import type { CALENDAR_SHARE_BUSY_TIME_SLOTS } from '@proton/shared/lib/calendar/constants';
import { CALENDAR_TYPE, MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import { getCalendarStatusInfo } from '@proton/shared/lib/calendar/subscribe/helpers';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { truncateMore } from '@proton/shared/lib/helpers/string';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';
import { CALENDAR_SUBSCRIPTION_STATUS } from '@proton/shared/lib/interfaces/calendar/Subscription';

import useGetCalendarActions from '../../hooks/useGetCalendarActions';
import useGetCalendarSetup from '../../hooks/useGetCalendarSetup';
import {
    getCalendarPayload,
    getCalendarSettingsPayload,
    getDefaultModel,
} from '../personalCalendarModal/calendarModalState';

interface Options {
    /** Called on cancel, and after the calendar is created */
    onClose?: () => void;
    onCreateCalendar?: (id: string) => void;
}

/** State and actions to subscribe to a calendar from its URL, shared by `SubscribedCalendarModal` and the lite page */
const useSubscribeCalendarForm = ({ onClose, onCreateCalendar }: Options = {}) => {
    const [, setCalendar] = useState<VisualCalendar | undefined>();
    const [calendarURL, setCalendarURL] = useState('');
    const [model, setModel] = useState(() => getDefaultModel(CALENDAR_TYPE.SUBSCRIPTION));
    const [error, setError] = useState(false);
    const [validationError, setValidationError] = useState<CALENDAR_SUBSCRIPTION_STATUS>();

    const [submitting, withSubmitting] = useLoading();
    const api = useApi();

    const { error: setupError, loading: loadingSetup } = useGetCalendarSetup({ setModel });

    const close = () => {
        setValidationError(undefined);
        setCalendarURL('');
        onClose?.();
    };

    const { handleCreateCalendar } = useGetCalendarActions({
        setCalendar,
        setError,
        onClose: close,
        onCreateCalendar,
        isSubscribedCalendar: true,
    });

    const processCalendar = async () => {
        const formattedModel = {
            ...model,
            name: truncateMore({ string: calendarURL, charsToDisplay: MAX_CHARS_API.CALENDAR_NAME }),
            url: calendarURL,
        };
        const calendarPayload = getCalendarPayload(formattedModel);
        const calendarSettingsPayload = getCalendarSettingsPayload(formattedModel);

        const {
            ValidationResult: { Result: result },
        } = await api<{ ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS } }>({
            ...validateSubscription({ url: calendarURL }),
            silence: true,
        }).catch((error) => {
            if (error?.status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY) {
                return { ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS.INVALID_URL } };
            }

            return { ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS.OK } };
        });

        if (result === CALENDAR_SUBSCRIPTION_STATUS.OK) {
            return handleCreateCalendar(formattedModel.addressID, calendarPayload, calendarSettingsPayload);
        }

        setValidationError(result);
    };

    const getErrorText = () => {
        if (validationError === CALENDAR_SUBSCRIPTION_STATUS.INVALID_URL) {
            return c('Error message').t`Invalid URL`;
        }

        if (validationError) {
            return getCalendarStatusInfo(validationError)?.text;
        }

        return null;
    };

    return {
        calendarURL,
        changeCalendarURL: (value: string) => {
            setValidationError(undefined);
            setCalendarURL(value.trim());
        },
        shareBusySlots: model.shareBusySlots,
        setShareBusySlots: (shareBusySlots: CALENDAR_SHARE_BUSY_TIME_SLOTS) => {
            setModel((previous) => ({ ...previous, shareBusySlots }));
        },
        errorText: getErrorText(),
        isSubmitDisabled: !calendarURL || !!validationError,
        loadingSetup,
        loading: loadingSetup || submitting,
        hasError: error || setupError,
        submit: () => withSubmitting(processCalendar()),
        close,
    };
};

export default useSubscribeCalendarForm;
