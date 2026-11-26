import type { ReactNode } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import useSubscribeCalendarForm from '@proton/calendar-settings/calendarModal/subscribedCalendarModal/useSubscribeCalendarForm';
import useBusySlotsAvailable from '@proton/calendar-settings/hooks/useBusySlotsAvailable';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import Toggle from '@proton/components/components/toggle/Toggle';
import { InputField } from '@proton/components/components/v2/field/InputField';
import GenericError from '@proton/components/containers/error/GenericError';
import { getVisualCalendars } from '@proton/shared/lib/calendar/calendar';
import {
    getCalendarsLimitReachedText,
    getHasUserReachedCalendarsLimit,
} from '@proton/shared/lib/calendar/calendarLimits';
import { CALENDAR_SHARE_BUSY_TIME_SLOTS } from '@proton/shared/lib/calendar/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import broadcast, { MessageType } from '../../broadcast';
import LiteSettingsPage from '../../components/settings/LiteSettingsPage';
import LiteSettingsRow from '../../components/settings/LiteSettingsRow';

import './CalendarAddFromUrl.scss';

interface Props {
    layout: (children: ReactNode, props?: any) => ReactNode;
    loader: ReactNode;
}

/** Subscribes to a calendar from its URL, for the NGC mobile apps. The native sheet shows the title and close button. */
const CalendarAddFromUrl = ({ layout, loader }: Props) => {
    const [calendars, loadingCalendars] = useCalendars();
    const [user, loadingUser] = useUser();
    const isBusySlotsAvailable = useBusySlotsAvailable(undefined, true);
    const isCalendarCreatedRef = useRef(false);

    const {
        calendarURL,
        changeCalendarURL,
        shareBusySlots,
        setShareBusySlots,
        errorText,
        isSubmitDisabled,
        loadingSetup,
        loading,
        hasError,
        submit,
    } = useSubscribeCalendarForm({
        // Called once the calendar and its keys exist, before the settings and event loop calls that can still fail
        onCreateCalendar: () => {
            isCalendarCreatedRef.current = true;
        },
        // Called by the create flow once everything succeeded; Cancel broadcasts CLOSE on its own
        onClose: () => broadcast({ type: MessageType.SUCCESS }),
    });

    /**
     * A failed key setup shows the error screen, and a failed create request shows its API error and keeps the form so
     * the user can retry. A failure after the calendar exists must not offer to add it a second time.
     */
    const handleSubmitError = () => {
        if (isCalendarCreatedRef.current) {
            broadcast({ type: MessageType.SUCCESS });
        }
    };

    if (loadingSetup || loadingCalendars || !calendars || loadingUser || !user) {
        return loader;
    }

    const { isOtherCalendarsLimitReached } = getHasUserReachedCalendarsLimit(
        getVisualCalendars(calendars),
        user.isFree
    );

    const cancelButton = (
        <Button fullWidth pill size="large" onClick={() => broadcast({ type: MessageType.CLOSE })}>
            {c('Action').t`Cancel`}
        </Button>
    );

    const getContent = () => {
        if (hasError) {
            return <GenericError />;
        }

        if (isOtherCalendarsLimitReached) {
            return (
                <p className="calendar-add-from-url-description">
                    {getCalendarsLimitReachedText(user.isFree).combinedText}
                </p>
            );
        }

        return (
            <>
                <p className="calendar-add-from-url-description">{c('Subscribe to calendar page')
                    .t`To subscribe to an external or public calendar and its updates, enter the URL. A read-only version of the calendar will be added to your Other calendars.`}</p>
                <div>
                    <InputField
                        autoFocus
                        aria-label={c('Subscribe to calendar modal').t`Calendar URL`}
                        placeholder={c('Subscribe to calendar modal').t`Calendar URL`}
                        error={errorText}
                        value={calendarURL}
                        onValue={changeCalendarURL}
                        data-testid="input:calendar-subscription"
                        className="calendar-add-from-url-input"
                    />
                    <Href
                        className="calendar-add-from-url-link"
                        href={getKnowledgeBaseUrl('/subscribe-to-external-calendar')}
                    >{c('Subscribe to calendar modal description').t`Learn how to get a private calendar link.`}</Href>
                </div>
                {isBusySlotsAvailable && (
                    <div className="lite-settings-panel">
                        <LiteSettingsRow
                            htmlFor="share-busy-schedule-toggle"
                            label={c('Label').t`Show others when I'm busy`}
                            description={c('Info')
                                .t`Other users within your organization will see your busy slots. No event details are shared.`}
                        >
                            <Toggle
                                id="share-busy-schedule-toggle"
                                checked={shareBusySlots === CALENDAR_SHARE_BUSY_TIME_SLOTS.YES}
                                onChange={({ target }) =>
                                    setShareBusySlots(
                                        target.checked
                                            ? CALENDAR_SHARE_BUSY_TIME_SLOTS.YES
                                            : CALENDAR_SHARE_BUSY_TIME_SLOTS.NO
                                    )
                                }
                            />
                        </LiteSettingsRow>
                    </div>
                )}
            </>
        );
    };

    const canSubmit = !hasError && !isOtherCalendarsLimitReached;

    return layout(
        <LiteSettingsPage>
            <form
                className="calendar-add-from-url"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (canSubmit && !loading && !isSubmitDisabled) {
                        submit().catch(handleSubmitError);
                    }
                }}
            >
                {getContent()}
                <div className="calendar-add-from-url-actions">
                    {canSubmit && (
                        <Button
                            type="submit"
                            color="norm"
                            fullWidth
                            pill
                            size="large"
                            loading={loading}
                            disabled={isSubmitDisabled}
                        >
                            {c('Action').t`Add`}
                        </Button>
                    )}
                    {cancelButton}
                </div>
            </form>
        </LiteSettingsPage>,
        { className: 'overflow-auto' }
    );
};

export default CalendarAddFromUrl;
