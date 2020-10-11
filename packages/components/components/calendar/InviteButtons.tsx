import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { move } from 'proton-shared/lib/helpers/array';
import { noop } from 'proton-shared/lib/helpers/function';
import { PartstatActions } from 'proton-shared/lib/interfaces/calendar';
import { c } from 'ttag';
import React from 'react';
import { useLoadingMap } from '../../hooks';
import { SmallButton } from '../button';
import { DropdownActions } from '../dropdown';

interface Props {
    actions: PartstatActions;
    partstat?: ICAL_ATTENDEE_STATUS;
    disabled?: boolean;
    className?: string;
}
const InviteButtons = ({ actions, partstat = ICAL_ATTENDEE_STATUS.NEEDS_ACTION, disabled, className = '' }: Props) => {
    const [loadingMap, withLoadingMap] = useLoadingMap();

    const { accept, acceptTentatively, decline } = actions;
    const onAccept = async () => withLoadingMap({ accept: accept() });
    const onTentative = async () => withLoadingMap({ tentative: acceptTentatively() });
    const onDecline = async () => withLoadingMap({ decline: decline() });

    const { accept: loadingAccept, tentative: loadingTentative, decline: loadingDecline } = loadingMap;
    const loadingAnswer = loadingAccept || loadingTentative || loadingDecline;

    if (partstat === ICAL_ATTENDEE_STATUS.NEEDS_ACTION) {
        return (
            <div className={className}>
                <SmallButton
                    onClick={onAccept}
                    disabled={loadingAnswer || disabled}
                    loading={loadingAccept}
                    className="mr0-5"
                >
                    {c('Action').t`Yes`}
                </SmallButton>
                <SmallButton
                    onClick={onTentative}
                    disabled={loadingAnswer || disabled}
                    loading={loadingTentative}
                    className="mr0-5"
                >
                    {c('Action').t`Maybe`}
                </SmallButton>
                <SmallButton onClick={onDecline} disabled={loadingAnswer || disabled} loading={loadingDecline}>
                    {c('Action').t`No`}
                </SmallButton>
            </div>
        );
    }
    const accepted = partstat === ICAL_ATTENDEE_STATUS.ACCEPTED;
    const tentative = partstat === ICAL_ATTENDEE_STATUS.TENTATIVE;
    const declined = partstat === ICAL_ATTENDEE_STATUS.DECLINED;
    const list = [
        {
            text: c('Action').t`Yes, I'm attending`,
            onClick: accepted ? noop : onAccept,
        },
        {
            text: c('Action').t`Maybe I'm attending`,
            onClick: tentative ? noop : onTentative,
        },
        {
            text: c('Action').t`No, I'm not attending`,
            onClick: declined ? noop : onDecline,
        },
    ];
    const answerIndex = [accepted, tentative, declined].findIndex((bool) => bool === true);
    const orderedList = move(list, answerIndex, 0);
    list.unshift();
    return (
        <div className={className}>
            <DropdownActions
                className="pm-button--small"
                key="actions"
                list={orderedList}
                loading={loadingAnswer}
                disabled={disabled}
            />
        </div>
    );
};

export default InviteButtons;
