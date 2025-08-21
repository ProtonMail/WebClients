import { type ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import { CYCLE, type Cycle, DEFAULT_CYCLE } from '@proton/payments';
import { omit } from '@proton/shared/lib/helpers/object';
import clsx from '@proton/utils/clsx';

import type { Props as ForwardedButtonGroupProps } from '../../components/button/ButtonGroup';
import Option from '../../components/option/Option';
import type { Props as ForwardedSelectProps } from '../../components/select/Select';
import Select from '../../components/select/Select';
import type { SelectTwoProps as ForwardedSelectTwoProps } from '../../components/selectTwo/SelectTwo';
import SelectTwo from '../../components/selectTwo/SelectTwo';

type CycleOption = { text: string; element?: ReactNode; value: Cycle };

interface SharedProps {
    cycle: Cycle;
    onSelect: (newCycle: Cycle | 'lifetime') => void;
    options?: CycleOption[];
    disabled?: boolean;
    minimumCycle?: Cycle;
    maximumCycle?: Cycle;
    additionalOptions?: (Omit<CycleOption, 'value'> & { value: Cycle | 'lifetime' })[];
    lifetimeSelected?: boolean;
}

interface SelectProps extends Omit<ForwardedSelectProps, 'onSelect' | 'onChange' | 'options'>, SharedProps {
    mode: 'select';
}

interface SelectTwoProps
    extends Omit<ForwardedSelectTwoProps<Cycle | 'lifetime'>, 'onSelect' | 'children' | 'onChange' | 'value'>,
        SharedProps {
    mode: 'select-two';
}

interface ButtonGroupProps extends Omit<ForwardedButtonGroupProps, 'onSelect' | 'children'>, SharedProps {
    mode: 'buttons';
}

export type CycleSelectorProps = ButtonGroupProps | SelectProps | SelectTwoProps;

const propsToOmit = ['onSelect', 'options', 'disabled', 'cycle', 'minimumCycle', 'maximumCycle'] as const;

export function getRestrictedCycle(
    props: Pick<SharedProps, 'options' | 'cycle' | 'minimumCycle' | 'maximumCycle' | 'additionalOptions'>
) {
    const defaultOptions: CycleOption[] = [
        { text: c('Billing cycle option').t`Monthly`, value: CYCLE.MONTHLY },
        { text: c('Billing cycle option').t`Annually`, value: CYCLE.YEARLY },
        { text: c('Billing cycle option').t`Two-year`, value: CYCLE.TWO_YEARS },
    ];

    const options = (props.options || defaultOptions)
        .filter(({ value }) => {
            const { minimumCycle, maximumCycle } = props;

            if (minimumCycle && value < minimumCycle) {
                return false;
            }
            if (maximumCycle && value > maximumCycle) {
                return false;
            }

            return true;
        })
        .sort((a, b) => a.value - b.value);

    const cycleToCheck = props.cycle || DEFAULT_CYCLE;

    // Check cycle is an option
    const optionValues = options.map(({ value }) => value);
    const optionsContainCycle = optionValues.includes(cycleToCheck);

    const optionsResult = [...options, ...(props.additionalOptions ?? [])];
    if (optionsContainCycle) {
        return {
            options: optionsResult,
            cycle: cycleToCheck,
        };
    }

    // If not then default the cycle to the highest option
    return {
        options: optionsResult,
        cycle: optionValues[optionValues.length - 1],
    };
}

const CycleSelector = (props: CycleSelectorProps) => {
    const { onSelect, disabled } = props;

    const { options, cycle } = getRestrictedCycle(props);

    if (props.mode === 'buttons') {
        const rest = omit(props, propsToOmit);
        return (
            <ButtonGroup {...rest}>
                {options.map(({ text, element, value }) => {
                    // translator: this text is only for screen readers, "Billing cycle: ${text}" (${text} contains: "1 month", "12 months" or "24 months")
                    const billingCycleVocalizedText = c('Info').t`Billing cycle: ${text}`;
                    const isSelected = props.lifetimeSelected ? value === 'lifetime' : cycle === value;

                    return (
                        <Button
                            className={clsx(isSelected && 'is-selected')}
                            key={value}
                            onClick={() => onSelect(value)}
                            disabled={disabled}
                            aria-label={billingCycleVocalizedText}
                            aria-pressed={isSelected}
                        >
                            {element ?? text}
                        </Button>
                    );
                })}
            </ButtonGroup>
        );
    }

    if (props.mode === 'select-two') {
        const rest = omit(props, propsToOmit);
        return (
            <SelectTwo
                {...rest}
                value={props.lifetimeSelected ? 'lifetime' : cycle}
                onChange={({ value }) => onSelect(value)}
                disabled={disabled}
            >
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

    const rest = omit(props, propsToOmit);
    return (
        <Select
            {...rest}
            title={c('Title').t`Billing cycle`}
            value={cycle}
            options={options}
            onChange={({ target }) => onSelect(+target.value as Cycle)}
        />
    );
};

export default CycleSelector;
