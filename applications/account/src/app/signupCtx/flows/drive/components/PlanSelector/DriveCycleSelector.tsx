import { c } from 'ttag';

import { type CycleSelectorProps, getRestrictedCycle } from '@proton/components/containers/payments/CycleSelector';
import clsx from '@proton/utils/clsx';

import './DriveCycleSelector.scss';

export const DriveCycleSelector = (props: Omit<CycleSelectorProps, 'mode'>) => {
    const { onSelect, disabled } = props;

    const { options, cycle } = getRestrictedCycle(props);

    return (
        <div className="font-arizona DriveCycleSelector flex flex-nowrap gap-1">
            {options.map(({ text, element, value }) => {
                // translator: this text is only for screen readers, "Billing cycle: ${text}" (${text} contains: "1 month", "12 months" or "24 months")
                const billingCycleVocalizedText = c('Info').t`Billing cycle: ${text}`;
                const isSelected = props.lifetimeSelected ? value === 'lifetime' : cycle === value;

                return (
                    <button
                        className={clsx(isSelected && 'is-selected')}
                        key={value}
                        onClick={() => onSelect(value)}
                        disabled={disabled}
                        aria-label={billingCycleVocalizedText}
                        aria-pressed={isSelected}
                    >
                        {element ?? text}
                    </button>
                );
            })}
        </div>
    );
};
