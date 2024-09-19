import type { ComponentPropsWithoutRef } from 'react';

import Option from '@proton/components/components/option/Option';
import type { CalendarSelectOption } from '@proton/shared/lib/interfaces/calendar';

import { SelectTwo } from '../selectTwo';
import type { SelectChangeEvent } from '../selectTwo/select';
import CalendarSelectIcon from './CalendarSelectIcon';

interface Props
    extends Omit<ComponentPropsWithoutRef<'button'>, 'value' | 'onClick' | 'onChange' | 'onKeyDown' | 'aria-label'> {
    calendarID: string;
    options: CalendarSelectOption[];
    onChange: (e: SelectChangeEvent<string>) => void;
    displayColor?: boolean;
    freeze?: boolean;
}

const CalendarSelect = ({ calendarID, options, onChange, displayColor = true, freeze = true, ...rest }: Props) => {
    if (freeze && options.length === 1) {
        const { name, color } = options[0];

        return (
            <div className="field border-none flex flex-nowrap items-center pl-0 w-full field--frozen">
                {displayColor && <CalendarSelectIcon color={color} className="shrink-0 mr-3" />}
                <span className="text-ellipsis">{name}</span>
            </div>
        );
    }

    return (
        <SelectTwo id={`calendar-${calendarID}`} value={calendarID} onChange={onChange} {...rest}>
            {options.map(({ id, name, color }) => (
                <Option key={id} value={id} title={name}>
                    <div className="flex flex-nowrap items-center">
                        {displayColor && <CalendarSelectIcon color={color} className="shrink-0 mr-3" />}
                        <div className="text-ellipsis">{name}</div>
                    </div>
                </Option>
            ))}
        </SelectTwo>
    );
};

export default CalendarSelect;
