import { c } from 'ttag';

import { type CycleSelectorProps, getRestrictedCycle } from '@proton/components/containers/payments/CycleSelector';
import { type CYCLE } from '@proton/payments';

import { type ToggleOption, ToggleSelector } from '../ToggleSelector/ToggleSelector';

export const CycleSelector = (props: Omit<CycleSelectorProps, 'mode'>) => {
    const { onSelect, disabled } = props;

    const { options, cycle } = getRestrictedCycle(props);

    const toggleOptions: ToggleOption<CYCLE>[] = options.map(({ text, element, value }) => ({
        text,
        element,
        value: value as CYCLE,
    }));

    return (
        <ToggleSelector
            options={toggleOptions}
            selectedValue={cycle}
            onSelect={onSelect}
            disabled={disabled}
            ariaLabelPrefix={c('Info').t`Billing cycle`}
        />
    );
};
