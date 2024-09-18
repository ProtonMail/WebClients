import type { DetailedHTMLProps, OptionHTMLAttributes, Ref, SelectHTMLAttributes } from 'react';
import { forwardRef, useState } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import useInput from '@proton/components/components/input/useInput';
import ErrorZone from '@proton/components/components/text/ErrorZone';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

export interface OptionProps extends DetailedHTMLProps<OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement> {
    value: string | number;
    text: string | number;
    group?: string;
    disabled?: boolean;
    key?: string;
}

const buildOptions = (options: OptionProps[] = [], keyPrefix = 'option') => {
    return options.map(({ key, text, ...rest }, index) => (
        <option key={key || `${keyPrefix}_${index}`} {...rest}>
            {text}
        </option>
    ));
};

const buildGroupedOptions = (options: OptionProps[] = []) => {
    const orphanOptions = options.filter((o: OptionProps) => !o.group);

    return (
        <>
            {buildOptions(orphanOptions)}
            {Object.entries(
                options.reduce<{ [key: string]: OptionProps[] }>((acc, option) => {
                    if (!option.group) {
                        return acc;
                    }

                    const { group } = option;
                    acc[group] = acc[group] || [];
                    acc[group].push(option);
                    return acc;
                }, {})
            ).map(([group, options], index) => {
                return (
                    <optgroup key={`optionGroup_${index}`} label={group}>
                        {buildOptions(options, `optionGroup_${index}`)}
                    </optgroup>
                );
            })}
        </>
    );
};

export interface Props extends DetailedHTMLProps<SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement> {
    ref?: Ref<HTMLSelectElement>; // override ref so that LegacyRef isn't used
    error?: string;
    isSubmitted?: boolean;
    size?: number;
    options: OptionProps[];
    loading?: boolean;
    classNameContainer?: string;
    placeholder?: string;
}

/**
 * @deprecated please use SelectTwo instead
 */
const Select = forwardRef<HTMLSelectElement, Props>(
    (
        {
            options,
            error,
            size = 1,
            className = '',
            multiple = false,
            loading = false,
            isSubmitted = false,
            classNameContainer,
            ...rest
        }: Props,
        ref
    ) => {
        const { handlers, statusClasses, status } = useInput<HTMLSelectElement>(rest);
        const [uid] = useState(generateUID('select'));
        const hasError = error && (status.isDirty || isSubmitted);
        const hasGroup = options.some(({ group }) => group);

        return (
            <>
                <span className={clsx(['w-full flex flex-column', classNameContainer])}>
                    <span className="flex relative w-full">
                        <select
                            className={clsx(['field w-full', className, statusClasses])}
                            size={size}
                            multiple={multiple}
                            disabled={loading || rest.disabled}
                            ref={ref}
                            {...rest}
                            {...handlers}
                        >
                            {hasGroup ? buildGroupedOptions(options) : buildOptions(options)}
                        </select>
                        <Icon name="chevron-down-filled" className="absolute pointer-events-none right-icon" />
                    </span>

                    {hasError && <ErrorZone id={uid}>{error}</ErrorZone>}
                </span>
            </>
        );
    }
);

export default Select;
