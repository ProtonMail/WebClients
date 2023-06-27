import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { CYCLE, DEFAULT_CYCLE } from '@proton/shared/lib/constants';
import { omit } from '@proton/shared/lib/helpers/object';
import { Cycle } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import ButtonGroup, { Props as ForwardedButtonGroupProps } from '../../components/button/ButtonGroup';
import Option from '../../components/option/Option';
import Select, { Props as ForwardedSelectProps } from '../../components/select/Select';
import SelectTwo, { Props as ForwardedSelectTwoProps } from '../../components/selectTwo/SelectTwo';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

interface SharedProps {
    cycle: Cycle;
    onSelect: (newCycle: Cycle) => void;
    options?: ForwardedSelectProps['options'];
    disabled?: boolean;
}

interface SelectProps extends Omit<ForwardedSelectProps, 'onSelect' | 'onChange' | 'options'>, SharedProps {
    mode: 'select';
}

interface SelectTwoProps
    extends Omit<ForwardedSelectTwoProps<Cycle>, 'onSelect' | 'children' | 'onChange' | 'value'>,
        SharedProps {
    mode: 'select-two';
}

interface ButtonGroupProps extends Omit<ForwardedButtonGroupProps, 'onSelect' | 'children'>, SharedProps {
    mode: 'buttons';
}

type Props = ButtonGroupProps | SelectProps | SelectTwoProps;

const propsToOmit = ['onSelect', 'options', 'cycle', 'disabled'] as const;

const CycleSelector = (props: Props) => {
    const {
        onSelect,
        options = [
            { text: c('Billing cycle option').t`Monthly`, value: MONTHLY },
            { text: c('Billing cycle option').t`Annually`, value: YEARLY },
            { text: c('Billing cycle option').t`Two-year`, value: TWO_YEARS },
        ],
        cycle = DEFAULT_CYCLE,
        disabled,
    } = props;

    if (props.mode === 'buttons') {
        const rest = omit(props, propsToOmit);
        return (
            <ButtonGroup {...rest}>
                {options.map(({ text, value }) => {
                    // translator: this text is only for screen readers, "Billing cycle: ${text}" (${text} contains: "1 month", "12 months" or "24 months")
                    const billingCycleVocalizedText = c('Info').t`Billing cycle: ${text}`;
                    const isSelected = cycle === value;

                    return (
                        <Button
                            className={clsx(isSelected && 'is-selected')}
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

    if (props.mode === 'select-two') {
        const rest = omit(props, propsToOmit);
        return (
            <SelectTwo {...rest} value={cycle} onChange={({ value }) => onSelect(value)} disabled={disabled}>
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
