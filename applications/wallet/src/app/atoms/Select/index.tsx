import type { MutableRefObject, ReactNode } from 'react';
import { useRef } from 'react';

import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import Option from '@proton/components/components/option/Option';
import { verticalPopperPlacements } from '@proton/components/components/popper/utils';
import type { SearcheableSelectProps as _CoreSearchableSelectProps } from '@proton/components/components/selectTwo/SearchableSelect';
import CoreSearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import type { SelectTwoProps } from '@proton/components/components/selectTwo/SelectTwo';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import type { InputFieldOwnProps } from '@proton/components/components/v2/field/InputField';
import InputField from '@proton/components/components/v2/field/InputField';
import clsx from '@proton/utils/clsx';

import '../InputFieldStacked/InputFieldStacked.scss';
import './Select.scss';

type Props<V> = Omit<
    SelectTwoProps<V> & InputFieldOwnProps,
    'children' | 'assistContainerClassName' | 'labelContainerClassName' | 'originalPlacement' | 'unstyled' | 'prefix'
> & {
    options: { id: string; value: V; label: string; disabled?: boolean; children?: ReactNode }[];
    label?: string | JSX.Element;
    containerClassName?: string;
    prefix?: JSX.Element;
    isGroupElement?: boolean;
    stackedFieldWrapper?: boolean;
};

export const Select = <V extends unknown>({
    options,
    containerClassName,
    prefix,
    isGroupElement,
    stackedFieldWrapper = true,
    ...props
}: Props<V>) => {
    const selectRef = useRef<HTMLDivElement>(null);

    const searchableSelect = (
        <InputField<typeof SelectTwo<V>>
            as={SelectTwo}
            dropdownClassName="wallet-select-dropdown"
            assistContainerClassName="empty:hidden"
            originalPlacement="bottom"
            unstyled={stackedFieldWrapper ? true : false}
            anchorRef={selectRef as MutableRefObject<any>}
            caretIconName="chevron-down"
            caretClassName={stackedFieldWrapper ? 'stacked-field-caret' : 'field-caret'}
            {...props}
        >
            {options.map((opt) => (
                <Option key={opt.id} title={opt.label} value={opt.value} disabled={opt.disabled}>
                    {opt.children}
                </Option>
            ))}
        </InputField>
    );

    if (stackedFieldWrapper) {
        return (
            <InputFieldStacked
                icon={prefix}
                isGroupElement={isGroupElement}
                isBigger
                ref={selectRef}
                classname={containerClassName}
            >
                {searchableSelect}
            </InputFieldStacked>
        );
    }

    return (
        <div ref={selectRef} className={clsx(containerClassName, 'wallet-select')}>
            <div className="shrink-0">{prefix}</div>
            {searchableSelect}
        </div>
    );
};

export type CoreSearchableSelectProps<V> = _CoreSearchableSelectProps<V>;

type SearchableSelectProps<V> = CoreSearchableSelectProps<V> & {
    label: string | JSX.Element;
    hint?: string;
    containerClassName?: string;
    anchorRef?: MutableRefObject<HTMLButtonElement | null>;
    isGroupElement?: boolean;
    stackedFieldWrapper?: boolean;
    caretClassName?: string;
};

export const SearchableSelect = <V extends unknown>({
    containerClassName,
    isGroupElement,
    stackedFieldWrapper = true,
    caretClassName,
    ...props
}: SearchableSelectProps<V>) => {
    const selectRef = useRef<HTMLDivElement>(null);

    const searchableSelect = (
        <InputField
            as={CoreSearchableSelect<V>}
            dropdownClassName="wallet-select-dropdown"
            assistContainerClassName="empty:hidden"
            originalPlacement="bottom"
            availablePlacements={verticalPopperPlacements}
            unstyled={stackedFieldWrapper ? true : false}
            anchorRef={selectRef as MutableRefObject<any>}
            caretIconName="chevron-down"
            caretClassName={stackedFieldWrapper ? 'stacked-field-caret' : 'field-caret'}
            {...props}
        />
    );

    if (stackedFieldWrapper) {
        return (
            <InputFieldStacked isGroupElement={isGroupElement} isBigger ref={selectRef} classname={containerClassName}>
                {searchableSelect}
            </InputFieldStacked>
        );
    }

    return (
        <div ref={selectRef} className={clsx(containerClassName, 'wallet-select')}>
            {searchableSelect}
        </div>
    );
};

interface SelectOptionProps {
    label: string;
    description?: string;
}

export const SelectOption = ({ label, description }: SelectOptionProps) => {
    return (
        <>
            <span className="block">{label}</span>
            {!!description && <span className="text-sm color-weak">{description}</span>}
        </>
    );
};
