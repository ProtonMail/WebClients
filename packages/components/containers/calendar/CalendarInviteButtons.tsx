import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { move } from 'proton-shared/lib/helpers/array';
import { noop } from 'proton-shared/lib/helpers/function';
import { PartstatActions } from 'proton-shared/lib/interfaces/calendar';
import { c } from 'ttag';
import React from 'react';
import { useLoadingMap } from '../../hooks';
import { Button, ButtonGroup, DropdownMenu, DropdownMenuButton, SimpleDropdown } from '../../components';

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
    const [loadingMap, withLoadingMap] = useLoadingMap();

    const { accept, acceptTentatively, decline } = actions;
    const onAccept = async () => withLoadingMap({ accept: accept() });
    const onTentative = async () => withLoadingMap({ tentative: acceptTentatively() });
    const onDecline = async () => withLoadingMap({ decline: decline() });

    const { accept: loadingAccept, tentative: loadingTentative, decline: loadingDecline } = loadingMap;
    const loadingAnswer = loadingAccept || loadingTentative || loadingDecline;

    const acceptText = c('Action').t`Yes, I'll attend`;
    const tentativeText = c('Action').t`Maybe I'll attend`;
    const declineText = c('Action').t`No, I won't attend`;

    if (partstat === ICAL_ATTENDEE_STATUS.NEEDS_ACTION) {
        return (
            <ButtonGroup className={className}>
                <Button
                    group
                    onClick={onAccept}
                    disabled={loadingAnswer || disabled}
                    loading={loadingAccept}
                    title={acceptText}
                >
                    {c('Action').t`Yes`}
                </Button>
                <Button
                    group
                    onClick={onTentative}
                    disabled={loadingAnswer || disabled}
                    loading={loadingTentative}
                    title={tentativeText}
                >
                    {c('Action').t`Maybe`}
                </Button>
                <Button
                    group
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
            originalPlacement="top-right"
            disabled={disabled}
            loading={loadingAnswer}
            className={className}
            title={c('Title').t`Change my answer`}
            content={text}
            data-test-id="dropdown:open"
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
