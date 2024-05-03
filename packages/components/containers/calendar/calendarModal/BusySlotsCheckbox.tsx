import React from 'react';

import { c } from 'ttag';

import { Checkbox, Info, InputFieldTwo } from '@proton/components/components';
import { useConfig } from '@proton/components/hooks';
import { CALENDAR_SHARE_BUSY_TIME_SLOTS } from '@proton/shared/lib/calendar/constants';

import useBusySlotsAvailable from '../hooks/useBusySlotsAvailable';

interface Props {
    value: CALENDAR_SHARE_BUSY_TIME_SLOTS | undefined;
    onChange: (value: CALENDAR_SHARE_BUSY_TIME_SLOTS) => void;
    disabled?: boolean;
}

export const BusySlotsLabelInfo = () => (
    <Info
        className="ml-2"
        title={c('Info').t`Other users within your organization will see your busy slots. No event details are shared.`}
    />
);

const BusySlotsLabel = () => (
    <>
        <span>{c('Label').t`Access to my events`}</span>
        <BusySlotsLabelInfo />
    </>
);

const BusySlotsCheckbox = ({ value, onChange, disabled }: Props) => {
    const { APP_NAME } = useConfig();
    const isBusySlotsAvailable = useBusySlotsAvailable();

    if (!isBusySlotsAvailable || APP_NAME !== 'proton-calendar') {
        return null;
    }

    const handleChange = () => {
        onChange(
            value === CALENDAR_SHARE_BUSY_TIME_SLOTS.YES
                ? CALENDAR_SHARE_BUSY_TIME_SLOTS.NO
                : CALENDAR_SHARE_BUSY_TIME_SLOTS.YES
        );
    };

    return (
        <InputFieldTwo
            as={Checkbox}
            checked={value === CALENDAR_SHARE_BUSY_TIME_SLOTS.YES}
            id="default-share-busy-schedule"
            label={<BusySlotsLabel />}
            onChange={handleChange}
            disabled={disabled}
        >
            {c('Label').t`Show others when I'm busy`}{' '}
        </InputFieldTwo>
    );
};

export default BusySlotsCheckbox;
