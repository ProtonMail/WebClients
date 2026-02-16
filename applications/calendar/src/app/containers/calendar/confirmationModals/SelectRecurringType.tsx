import type { Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import Row from '@proton/components/components/container/Row';
import Radio from '@proton/components/components/input/Radio';
import { RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';
import isTruthy from '@proton/utils/isTruthy';

interface Props {
    types: RECURRING_TYPES[];
    type: RECURRING_TYPES;
    setType: Dispatch<SetStateAction<RECURRING_TYPES>>;
    'data-testid': string;
}

const SelectRecurringType = ({ types, type, setType, 'data-testid': dataTestId }: Props) => {
    const radios = [
        types.includes(RECURRING_TYPES.SINGLE) && {
            label: c('Option').t`This event`,
            value: RECURRING_TYPES.SINGLE,
        },
        types.includes(RECURRING_TYPES.FUTURE) && {
            label: c('Option').t`This and future events`,
            value: RECURRING_TYPES.FUTURE,
        },
        types.includes(RECURRING_TYPES.ALL) && {
            label: c('Option').t`All events`,
            value: RECURRING_TYPES.ALL,
        },
    ].filter(isTruthy);

    return (
        <>
            {radios.map(({ label, value }, i) => {
                const id = i.toString();
                return (
                    <Row key={label}>
                        <Radio
                            className="flex-nowrap"
                            data-testid={dataTestId}
                            id={`recurringTypeChoice${id}`}
                            name="recurringType"
                            checked={value === type}
                            onChange={() => setType(value)}
                        >
                            {label}
                        </Radio>
                    </Row>
                );
            })}
        </>
    );
};

export default SelectRecurringType;
