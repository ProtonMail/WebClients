import { c } from 'ttag';
import { CYCLE, DEFAULT_CYCLE } from '@proton/shared/lib/constants';
import { Cycle } from '@proton/shared/lib/interfaces';

import Select, { Props as SelectProps } from '../../components/select/Select';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

interface Props extends Omit<SelectProps, 'onSelect' | 'onChange' | 'options'> {
    cycle: Cycle;
    onSelect: (newCycle: Cycle) => void;
    options?: SelectProps['options'];
}

const CycleSelector = ({
    cycle = DEFAULT_CYCLE,
    onSelect,
    options = [
        { text: c('Billing cycle option').t`Monthly`, value: MONTHLY },
        { text: c('Billing cycle option').t`Annually`, value: YEARLY },
        { text: c('Billing cycle option').t`Two-year`, value: TWO_YEARS },
    ],
    ...rest
}: Props) => {
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
