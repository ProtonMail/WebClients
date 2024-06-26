import { ReactNode } from 'react';

import Option from '@proton/components/components/option/Option';
import CoreSearchableSelect, {
    Props as _CoreSearchableSelectProps,
} from '@proton/components/components/selectTwo/SearchableSelect';
import SelectTwo, { Props as SelectTwoProps } from '@proton/components/components/selectTwo/SelectTwo';
import InputField, { InputFieldOwnProps } from '@proton/components/components/v2/field/InputField';
import clsx from '@proton/utils/clsx';

import './Select.scss';

type Props<V> = Omit<
    SelectTwoProps<V> & InputFieldOwnProps,
    'children' | 'assistContainerClassName' | 'labelContainerClassName' | 'originalPlacement' | 'unstyled' | 'prefix'
> & {
    options: { id: string; value: V; label: string; disabled?: boolean; children?: ReactNode }[];
    label?: string | JSX.Element;
    bordered?: boolean;
    containerClassName?: string;
    prefix?: JSX.Element;
};

export const Select = <V extends unknown>({ options, bordered, containerClassName, prefix, ...props }: Props<V>) => {
    return (
        <div
            className={clsx(
                'wallet-select flex flex-row items-center flex-nowrap bg-weak py-5 px-6 rounded-xl color-norm w-full',
                bordered && 'bordered',
                props.disabled && 'disabled',
                containerClassName
            )}
        >
            {prefix}
            <InputField<typeof SelectTwo<V>>
                as={SelectTwo}
                assistContainerClassName="empty:hidden"
                labelContainerClassName="expand-click-area color-hint m-0 text-normal text-sm"
                inputContainerClassName="mt-1"
                originalPlacement="bottom"
                unstyled
                {...props}
            >
                {options.map((opt) => (
                    <Option key={opt.id} title={opt.label} value={opt.value} disabled={opt.disabled}>
                        {opt.children}
                    </Option>
                ))}
            </InputField>
        </div>
    );
};

export type CoreSearchableSelectProps<V> = _CoreSearchableSelectProps<V>;

type SearchableSelectProps<V> = CoreSearchableSelectProps<V> & {
    label: string | JSX.Element;
    hint?: string;
    bordered?: boolean;
    containerClassName?: string;
};

export const SearchableSelect = <V extends unknown>({
    bordered,
    containerClassName,
    ...props
}: SearchableSelectProps<V>) => {
    return (
        <div
            className={clsx(
                'wallet-select wallet-select-dropdown-button bg-weak py-5 px-6 rounded-xl color-norm w-full',
                bordered && 'bordered',
                props.disabled && 'disabled',
                containerClassName
            )}
        >
            <InputField
                as={CoreSearchableSelect<V>}
                dropdownClassName={'wallet-select-dropdown'}
                assistContainerClassName="empty:hidden"
                labelContainerClassName="expand-click-area color-hint m-0 text-normal text-sm"
                inputContainerClassName="mt-1"
                originalPlacement="bottom"
                unstyled
                {...props}
            />
        </div>
    );
};
