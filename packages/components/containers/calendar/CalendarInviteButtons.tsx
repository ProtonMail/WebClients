import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import useApi from '@proton/components/hooks/useApi';
import { useSubscription } from '@proton/components/hooks/useSubscription';
import { useLoading } from '@proton/hooks';
import { TelemetryCalendarEvents } from '@proton/shared/lib/api/telemetry';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { PLANS } from '@proton/shared/lib/constants';
import { getPlan } from '@proton/shared/lib/helpers/subscription';
import type { PartstatActions } from '@proton/shared/lib/interfaces/calendar';
import move from '@proton/utils/move';
import noop from '@proton/utils/noop';

import { sendCalendarInviteReport } from './CalendarInviteTelemetry';

interface Props {
    actions: PartstatActions;
    partstat?: ICAL_ATTENDEE_STATUS;
    disabled?: boolean;
    className?: string;
}
const CalendarInviteButtons = ({
    actions,
    partstat = ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
    disabled,
    className = '',
}: Props) => {
    const api = useApi();
    const [subscription] = useSubscription();
    const plan: PLANS = getPlan(subscription)?.Name || PLANS.FREE;
    const [loadingAccept, withLoadingAccept] = useLoading();
    const [loadingTentative, withLoadingTentative] = useLoading();
    const [loadingDecline, withLoadingDecline] = useLoading();

    const { accept, acceptTentatively, decline } = actions;
    const onAccept = () => {
        void sendCalendarInviteReport(api, {
            event: TelemetryCalendarEvents.answer_invite,
            dimensions: { answer: 'yes', plan },
        });
        return withLoadingAccept(accept());
    };
    const onTentative = () => {
        void sendCalendarInviteReport(api, {
            event: TelemetryCalendarEvents.answer_invite,
            dimensions: { answer: 'maybe', plan },
        });
        return withLoadingTentative(acceptTentatively());
    };
    const onDecline = () => {
        void sendCalendarInviteReport(api, {
            event: TelemetryCalendarEvents.answer_invite,
            dimensions: { answer: 'no', plan },
        });
        return withLoadingDecline(decline());
    };

    const loadingAnswer = loadingAccept || loadingTentative || loadingDecline;

    const acceptText = c('Action').t`Yes, I'll attend`;
    const tentativeText = c('Action').t`Maybe I'll attend`;
    const declineText = c('Action').t`No, I won't attend`;

    if (partstat === ICAL_ATTENDEE_STATUS.NEEDS_ACTION) {
        return (
            <ButtonGroup className={className}>
                <Button
                    onClick={onAccept}
                    disabled={loadingAnswer || disabled}
                    loading={loadingAccept}
                    title={acceptText}
                >
                    {c('Action').t`Yes`}
                </Button>
                <Button
                    onClick={onTentative}
                    disabled={loadingAnswer || disabled}
                    loading={loadingTentative}
                    title={tentativeText}
                >
                    {c('Action').t`Maybe`}
                </Button>
                <Button
                    onClick={onDecline}
                    disabled={loadingAnswer || disabled}
                    loading={loadingDecline}
                    title={declineText}
                >
                    {c('Action').t`No`}
                </Button>
            </ButtonGroup>
        );
    }
    const accepted = partstat === ICAL_ATTENDEE_STATUS.ACCEPTED;
    const tentative = partstat === ICAL_ATTENDEE_STATUS.TENTATIVE;
    const declined = partstat === ICAL_ATTENDEE_STATUS.DECLINED;
    const list = [
        {
            text: acceptText,
            onClick: accepted ? noop : onAccept,
        },
        {
            text: tentativeText,
            onClick: tentative ? noop : onTentative,
        },
        {
            text: declineText,
            onClick: declined ? noop : onDecline,
        },
    ];
    const answerIndex = [accepted, tentative, declined].findIndex((bool) => bool === true);
    const orderedList = move(list, answerIndex, 0);
    const [{ text }, ...restList] = orderedList;

    return (
        <SimpleDropdown
            originalPlacement="top-end"
            disabled={disabled}
            loading={loadingAnswer}
            className={className}
            title={c('Title').t`Change my answer`}
            content={<div className="text-ellipsis">{text}</div>}
            data-testid="dropdown:open"
        >
            <DropdownMenu>
                {restList.map(({ text, ...restProps }, index) => {
                    return (
                        <DropdownMenuButton className="text-left" key={index} {...restProps}>
                            {text}
                        </DropdownMenuButton>
                    );
                })}
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export default CalendarInviteButtons;
