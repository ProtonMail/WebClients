import React from 'react';

import { c } from 'ttag';

import { Checkbox, Info, InputFieldTwo } from '@proton/components/components';
import { CALENDAR_SHARE_BUSY_TIME_SLOTS } from '@proton/shared/lib/calendar/constants';

import useBusyTimeSlotsAvailable from '../hooks/useBusyTimeSlotsAvailable';

interface Props {
    value: CALENDAR_SHARE_BUSY_TIME_SLOTS;
    onChange: (value: CALENDAR_SHARE_BUSY_TIME_SLOTS) => void;
}

const BusyTimeSlotsCheckbox = ({ value, onChange }: Props) => {
    const isBusyTimeSlotsAvailable = useBusyTimeSlotsAvailable();

    if (!isBusyTimeSlotsAvailable) {
        return null;
    }

    const label = (
        <>
            {c('Label').t`Access to my events`}
            <Info
                className="ml-2"
                title={c('Info')
                    .t`Other users within your organization will see your busy slots. No event details are shared.`}
            />
        </>
    );

    return (
        <InputFieldTwo
            as={Checkbox}
            checked={value === CALENDAR_SHARE_BUSY_TIME_SLOTS.YES}
            id="default-share-busy-schedule"
            label={label}
            onChange={() => {
                onChange(
                    value === CALENDAR_SHARE_BUSY_TIME_SLOTS.YES
                        ? CALENDAR_SHARE_BUSY_TIME_SLOTS.NO
                        : CALENDAR_SHARE_BUSY_TIME_SLOTS.YES
                );
            }}
        >
            {c('Label').t`Show others when I'm busy`}{' '}
        </InputFieldTwo>
    );
};

export default BusyTimeSlotsCheckbox;
