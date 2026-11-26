import type { ReactNode } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import useSubscribeCalendarForm from '@proton/calendar-settings/calendarModal/subscribedCalendarModal/useSubscribeCalendarForm';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { InputField } from '@proton/components/components/v2/field/InputField';
import GenericError from '@proton/components/containers/error/GenericError';
import { getVisualCalendars } from '@proton/shared/lib/calendar/calendar';
import {
    getCalendarsLimitReachedText,
    getHasUserReachedCalendarsLimit,
} from '@proton/shared/lib/calendar/calendarLimits';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import broadcast, { MessageType } from '../../broadcast';
import LiteBusySlotsPanel from '../../components/settings/LiteBusySlotsPanel';
import LiteSettingsPage from '../../components/settings/LiteSettingsPage';
import LiteSettingsSheet from '../../components/settings/LiteSettingsSheet';

import './CalendarAddFromUrl.scss';

interface Props {
    layout: (children: ReactNode, props?: any) => ReactNode;
    loader: ReactNode;
}

/** Subscribes to a calendar from its URL, for the NGC mobile apps. The native sheet shows the title and close button. */
const CalendarAddFromUrl = ({ layout, loader }: Props) => {
    const [calendars, loadingCalendars] = useCalendars();
    const [user, loadingUser] = useUser();
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

    const renderPage = (sheet: ReactNode) => {
        return layout(<LiteSettingsPage>{sheet}</LiteSettingsPage>, { className: 'overflow-auto' });
    };

    const handleCancel = () => {
        broadcast({ type: MessageType.CLOSE });
    };

    if (hasError) {
        return renderPage(
            <LiteSettingsSheet onCancel={handleCancel}>
                <GenericError />
            </LiteSettingsSheet>
        );
    }

    if (isOtherCalendarsLimitReached) {
        return renderPage(
            <LiteSettingsSheet
                description={getCalendarsLimitReachedText(user.isFree).combinedText}
                onCancel={handleCancel}
            />
        );
    }

    return renderPage(
        <LiteSettingsSheet
            className="calendar-add-from-url"
            description={c('Subscribe to calendar page')
                .t`To subscribe to an external or public calendar and its updates, enter the URL. A read-only version of the calendar will be added to your Other calendars.`}
            onSubmit={() => {
                if (!loading && !isSubmitDisabled) {
                    submit().catch(handleSubmitError);
                }
            }}
            onCancel={handleCancel}
            submitButton={
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
            }
        >
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
            <LiteBusySlotsPanel value={shareBusySlots} onChange={setShareBusySlots} />
        </LiteSettingsSheet>
    );
};

export default CalendarAddFromUrl;
