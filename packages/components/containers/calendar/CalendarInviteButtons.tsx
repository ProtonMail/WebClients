import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { useLoading } from '@proton/hooks';
import { PLANS } from '@proton/payments';
import { TelemetryCalendarEvents } from '@proton/shared/lib/api/telemetry';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { APPS } from '@proton/shared/lib/constants';
import { getPlan } from '@proton/shared/lib/helpers/subscription';
import type { PartstatActions } from '@proton/shared/lib/interfaces/calendar';

import { sendCalendarInviteReport } from './CalendarInviteTelemetry';
import { useCalendarERRTetric } from './metrics/useCalendarERRTMetric';

interface Props {
    actions: PartstatActions;
    originalPartstat?: ICAL_ATTENDEE_STATUS;
    partstat?: ICAL_ATTENDEE_STATUS;
    disabled?: boolean;
    className?: string;
}

enum ATTENDEE_RESPONE_TYPE {
    ACCEPTED = 0,
    TENTATIVE = 1,
    DECLINED = 2,
}

const RESPONSE_TYPE_MAP = {
    [ICAL_ATTENDEE_STATUS.NEEDS_ACTION]: undefined,
    [ICAL_ATTENDEE_STATUS.DELEGATED]: undefined,
    [ICAL_ATTENDEE_STATUS.ACCEPTED]: ATTENDEE_RESPONE_TYPE.ACCEPTED,
    [ICAL_ATTENDEE_STATUS.TENTATIVE]: ATTENDEE_RESPONE_TYPE.TENTATIVE,
    [ICAL_ATTENDEE_STATUS.DECLINED]: ATTENDEE_RESPONE_TYPE.DECLINED,
};

const CalendarInviteButtons = ({
    actions,
    originalPartstat,
    partstat = ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
    disabled,
    className = '',
}: Props) => {
    const api = useApi();
    const { APP_NAME } = useConfig();
    const isCalendarApp = APP_NAME === APPS.PROTONCALENDAR;
    const [subscription] = useSubscription();
    const plan: PLANS = getPlan(subscription)?.Name || PLANS.FREE;
    const [loadingAccept, withLoadingAccept] = useLoading();
    const [loadingTentative, withLoadingTentative] = useLoading();
    const [loadingDecline, withLoadingDecline] = useLoading();
    const { startERRTMetric, stopERRTMetric } = useCalendarERRTetric();

    const { accept, acceptTentatively, decline } = actions;

    const [selectedAnswer, setSelectedAnswer] = useState(RESPONSE_TYPE_MAP[partstat]);

    useEffect(() => {
        setSelectedAnswer(RESPONSE_TYPE_MAP[partstat]);
    }, [partstat]);

    const onAccept = () => {
        const originalAnswer = selectedAnswer;
        setSelectedAnswer(ATTENDEE_RESPONE_TYPE.ACCEPTED);

        void sendCalendarInviteReport(api, {
            event: TelemetryCalendarEvents.answer_invite,
            dimensions: { answer: 'yes', plan },
        });
        startERRTMetric('accept');
        const promise = withLoadingAccept(accept())
            .then(() => {
                stopERRTMetric();
            })
            .catch(() => {
                setSelectedAnswer(originalAnswer);
            });
        return promise;
    };
    const onTentative = () => {
        const originalAnswer = selectedAnswer;
        setSelectedAnswer(ATTENDEE_RESPONE_TYPE.TENTATIVE);

        void sendCalendarInviteReport(api, {
            event: TelemetryCalendarEvents.answer_invite,
            dimensions: { answer: 'maybe', plan },
        });
        startERRTMetric('tentative');
        const promise = withLoadingTentative(acceptTentatively())
            .then(() => {
                stopERRTMetric();
            })
            .catch(() => {
                setSelectedAnswer(originalAnswer);
            });
        return promise;
    };
    const onDecline = () => {
        const originalAnswer = selectedAnswer;
        setSelectedAnswer(ATTENDEE_RESPONE_TYPE.DECLINED);

        void sendCalendarInviteReport(api, {
            event: TelemetryCalendarEvents.answer_invite,
            dimensions: { answer: 'no', plan },
        });
        startERRTMetric('decline');
        const promise = withLoadingDecline(decline())
            .then(() => {
                stopERRTMetric();
            })
            .catch(() => {
                setSelectedAnswer(originalAnswer);
            });
        return promise;
    };

    const loadingAnswer = loadingAccept || loadingTentative || loadingDecline;

    const acceptText = c('Action').t`Yes, I'll attend`;
    const tentativeText = c('Action').t`Maybe I'll attend`;
    const declineText = c('Action').t`No, I won't attend`;

    const list = [
        {
            text: acceptText,
            onClick: onAccept,
            isSelected: selectedAnswer === ATTENDEE_RESPONE_TYPE.ACCEPTED,
        },
        {
            text: tentativeText,
            onClick: onTentative,
            isSelected: selectedAnswer === ATTENDEE_RESPONE_TYPE.TENTATIVE,
        },
        {
            text: declineText,
            onClick: onDecline,
            isSelected: selectedAnswer === ATTENDEE_RESPONE_TYPE.DECLINED,
        },
    ];
    const { text } = list.find((ans) => ans.isSelected) || list[0];
    const restList = list.filter((ans) => !ans.isSelected);

    if (
        originalPartstat == ICAL_ATTENDEE_STATUS.NEEDS_ACTION ||
        (!originalPartstat && partstat === ICAL_ATTENDEE_STATUS.NEEDS_ACTION)
    ) {
        return (
            <ButtonGroup className={className} color="weak">
                <Button
                    onClick={onAccept}
                    disabled={loadingAnswer || disabled}
                    loading={isCalendarApp ? false : loadingAccept}
                    title={acceptText}
                    selected={selectedAnswer === ATTENDEE_RESPONE_TYPE.ACCEPTED}
                >
                    {c('Action').t`Yes`}
                </Button>
                <Button
                    onClick={onTentative}
                    disabled={loadingAnswer || disabled}
                    loading={isCalendarApp ? false : loadingTentative}
                    title={tentativeText}
                    selected={selectedAnswer === ATTENDEE_RESPONE_TYPE.TENTATIVE}
                >
                    {c('Action').t`Maybe`}
                </Button>
                <Button
                    onClick={onDecline}
                    disabled={loadingAnswer || disabled}
                    loading={isCalendarApp ? false : loadingDecline}
                    title={declineText}
                    selected={selectedAnswer === ATTENDEE_RESPONE_TYPE.DECLINED}
                >
                    {c('Action').t`No`}
                </Button>
            </ButtonGroup>
        );
    }

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
