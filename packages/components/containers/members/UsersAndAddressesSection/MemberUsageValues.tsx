import { isToday, isYesterday } from 'date-fns';
import { c } from 'ttag';

import TimeIntl from '@proton/components/components/time/TimeIntl';
import type { MemberLastConnection } from '@proton/shared/lib/api/members';

const NO_VALUE = '-';

const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

const dateTimeOptions: Intl.DateTimeFormatOptions = { ...dateOptions, hour: '2-digit', minute: '2-digit' };

const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

// "Today" / "Yesterday" / a formatted date. `options` sets the fallback date format (day-only or
// day-and-time). The day and time stay in one translated string so translators control the separator.
const renderTimeLabel = (unixSeconds: number, options: Intl.DateTimeFormatOptions, withTime: boolean) => {
    const date = new Date(unixSeconds * 1000);

    const time = withTime ? (
        <TimeIntl key="time" options={timeOptions}>
            {unixSeconds}
        </TimeIntl>
    ) : '';

    if (isToday(date)) {
        return withTime ? <>{c('Members table usage').jt`Today, ${time}`}</> : <>{c('Members table usage').t`Today`}</>;
    }

    if (isYesterday(date)) {
        return withTime ? (
            <>{c('Members table usage').jt`Yesterday, ${time}`}</>
        ) : (
            <>{c('Members table usage').t`Yesterday`}</>
        );
    }

    return <TimeIntl options={options}>{unixSeconds}</TimeIntl>;
};

export const LastActivityValue = ({ lastActivity }: { lastActivity: number | null }) => {
    if (lastActivity === null) {
        return <>{NO_VALUE}</>;
    }

    // Day-level only: "Today" / "Yesterday" / "Jul 25, 2026" (no time).
    return renderTimeLabel(lastActivity, dateOptions, false);
};

export const LastConnectionValue = ({ lastConnection }: { lastConnection: MemberLastConnection | null }) => {
    if (lastConnection === null) {
        return <>{NO_VALUE}</>;
    }

    return (
        <>
            {renderTimeLabel(lastConnection.LastConnectionTime, dateTimeOptions, true)}
            <div className="color-weak">{lastConnection.Gateway}</div>
        </>
    );
};
