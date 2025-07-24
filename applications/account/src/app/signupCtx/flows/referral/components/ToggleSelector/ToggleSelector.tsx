import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import './ToggleSelector.scss';

export interface ToggleOption<T = string> {
    text: string;
    value: T;
    element?: React.ReactNode;
}

interface ToggleSelectorProps<T = string> {
    options: ToggleOption<T>[];
    selectedValue: T;
    onSelect: (value: T) => void;
    disabled?: boolean;
    className?: string;
    ariaLabelPrefix?: string;
}

export const ToggleSelector = <T = string,>({
    options,
    selectedValue,
    onSelect,
    disabled,
    className,
    ariaLabelPrefix,
}: ToggleSelectorProps<T>) => {
    return (
        <div className={clsx('ToggleSelector p-1 flex flex-nowrap gap-1', className)}>
            {options.map(({ text, element, value }) => {
                const isSelected = selectedValue === value;
                const vocalizedText = ariaLabelPrefix ? c('Info').t`${ariaLabelPrefix}: ${text}` : text;

                return (
                    <button
                        className={clsx(
                            'interactive-pseudo relative rounded-full',
                            isSelected && 'is-selected text-semibold'
                        )}
                        key={String(value)}
                        onClick={() => onSelect(value)}
                        disabled={disabled}
                        aria-label={vocalizedText}
                        aria-pressed={isSelected}
                    >
                        {element ?? text}
                    </button>
                );
            })}
        </div>
    );
};
