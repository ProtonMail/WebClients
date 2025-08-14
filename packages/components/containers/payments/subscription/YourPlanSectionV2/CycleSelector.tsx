import { c } from 'ttag';

import { type CycleSelectorProps, getRestrictedCycle } from '@proton/components/containers/payments/CycleSelector';
import { CYCLE } from '@proton/payments';
import clsx from '@proton/utils/clsx';

export const CycleSelector = (props: Omit<CycleSelectorProps, 'mode'> & { userCanHave24MonthPlan?: boolean }) => {
    const { onSelect, disabled, userCanHave24MonthPlan = false } = props;

    const { cycle } = getRestrictedCycle(props);

    const options = [
        { text: c('Signup').t`1 month`, value: CYCLE.MONTHLY, content: null },
        { text: c('Signup').t`12 months`, value: CYCLE.YEARLY, content: null },
        ...(userCanHave24MonthPlan ? [{ text: c('Signup').t`24 months`, value: CYCLE.TWO_YEARS, content: null }] : []),
    ];

    return (
        <div className="flex flex-nowrap gap-2">
            {options.map(({ text, value }) => {
                const billingCycleVocalizedText = c('Info').t`Billing cycle: ${text}`;
                const isSelected = cycle === value;

                return (
                    <button
                        type="button"
                        key={value}
                        onClick={() => !disabled && onSelect(value)}
                        disabled={disabled}
                        aria-label={billingCycleVocalizedText}
                        aria-pressed={isSelected}
                        className={clsx(
                            'flex flex-nowrap items-center gap-1 relative interactive--no-background',
                            'p-1 interactive-pseudo rounded',
                            !isSelected && 'color-weak hover:color-norm',
                            isSelected && 'text-semibold color-primary'
                        )}
                    >
                        <span
                            className="rounded-full border flex items-center justify-center shrink-0 grow-0 bg-norm w-custom ratio-square mr-1"
                            style={{ '--w-custom': '1.25rem' }}
                        >
                            <span
                                className={clsx(
                                    isSelected ? 'block' : 'hidden',
                                    'fade-in w-custom ratio-square rounded-full bg-primary'
                                )}
                                style={{ '--w-custom': '0.5rem' }}
                            />
                        </span>
                        <span data-title={text}>{text}</span>
                    </button>
                );
            })}
        </div>
    );
};
