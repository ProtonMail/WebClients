import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { CYCLE, DEFAULT_CYCLE } from '@proton/shared/lib/constants';
import { Cycle } from '@proton/shared/lib/interfaces';

import { ButtonGroup, Option, SelectTwo } from '../../components';
import Select, { Props as SelectProps } from '../../components/select/Select';
import { classnames } from '../../helpers';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

interface Props extends Omit<SelectProps, 'onSelect' | 'onChange' | 'options'> {
    cycle: Cycle;
    onSelect: (newCycle: Cycle) => void;
    options?: SelectProps['options'];
    mode?: 'buttons' | 'select' | 'select-two';
    disabled?: boolean;
}

const CycleSelector = ({
    cycle = DEFAULT_CYCLE,
    mode = 'select',
    disabled,
    onSelect,
    options = [
        { text: c('Billing cycle option').t`Monthly`, value: MONTHLY },
        { text: c('Billing cycle option').t`Annually`, value: YEARLY },
        { text: c('Billing cycle option').t`Two-year`, value: TWO_YEARS },
    ],
    ...rest
}: Props) => {
    if (mode === 'buttons') {
        return (
            <ButtonGroup>
                {options.map(({ text, value }) => {
                    // translator: this text is only for screen readers, "Billing cycle: ${text}" (${text} contains: "1 month", "12 months" or "24 months")
                    const billingCycleVocalizedText = c('Info').t`Billing cycle: ${text}`;
                    const isSelected = cycle === value;

                    return (
                        <Button
                            className={classnames([isSelected && 'is-selected'])}
                            key={value}
                            onClick={() => onSelect(value as Cycle)}
                            disabled={disabled}
                            aria-label={billingCycleVocalizedText}
                            aria-pressed={isSelected}
                        >
                            {text}
                        </Button>
                    );
                })}
            </ButtonGroup>
        );
    }
    if (mode === 'select-two') {
        const handleChange = ({ value }: { value: Cycle }) => onSelect(value);
        return (
            <SelectTwo value={cycle} onChange={handleChange} disabled={disabled}>
                {options.map(({ text, value }) => {
                    return (
                        <Option value={value} title={`${text}`}>
                            {text}
                        </Option>
                    );
                })}
            </SelectTwo>
        );
    }
    return (
        <Select
            title={c('Title').t`Billing cycle`}
            value={cycle}
            options={options}
            onChange={({ target }) => onSelect(+target.value as Cycle)}
            {...rest}
        />
    );
};

export default CycleSelector;
