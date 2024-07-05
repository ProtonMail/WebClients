import { MutableRefObject, ReactNode, useRef } from 'react';

import { InputFieldStacked } from '@proton/components/components/inputFieldStacked';
import Option from '@proton/components/components/option/Option';
import CoreSearchableSelect, {
    Props as _CoreSearchableSelectProps,
} from '@proton/components/components/selectTwo/SearchableSelect';
import SelectTwo, { Props as SelectTwoProps } from '@proton/components/components/selectTwo/SelectTwo';
import InputField, { InputFieldOwnProps } from '@proton/components/components/v2/field/InputField';

import '../InputFieldStacked/InputFieldStacked.scss';

type Props<V> = Omit<
    SelectTwoProps<V> & InputFieldOwnProps,
    'children' | 'assistContainerClassName' | 'labelContainerClassName' | 'originalPlacement' | 'unstyled' | 'prefix'
> & {
    options: { id: string; value: V; label: string; disabled?: boolean; children?: ReactNode }[];
    label?: string | JSX.Element;
    containerClassName?: string;
    prefix?: JSX.Element;
    isGroupElement?: boolean;
};

export const Select = <V extends unknown>({
    options,
    containerClassName,
    prefix,
    isGroupElement,
    ...props
}: Props<V>) => {
    const selectRef = useRef<HTMLDivElement>(null);

    return (
        <InputFieldStacked isGroupElement={isGroupElement} isBigger ref={selectRef} classname={containerClassName}>
            {prefix}
            <InputField<typeof SelectTwo<V>>
                as={SelectTwo}
                dropdownClassName="wallet-select-dropdown"
                assistContainerClassName="empty:hidden"
                originalPlacement="bottom"
                unstyled
                anchorRef={selectRef as MutableRefObject<any>}
                caretIconName="chevron-down"
                caretClassName="stacked-field-caret"
                {...props}
            >
                {options.map((opt) => (
                    <Option key={opt.id} title={opt.label} value={opt.value} disabled={opt.disabled}>
                        {opt.children}
                    </Option>
                ))}
            </InputField>
        </InputFieldStacked>
    );
};

export type CoreSearchableSelectProps<V> = _CoreSearchableSelectProps<V>;

type SearchableSelectProps<V> = CoreSearchableSelectProps<V> & {
    label: string | JSX.Element;
    hint?: string;
    containerClassName?: string;
    anchorRef?: MutableRefObject<HTMLButtonElement | null>;
    isGroupElement?: boolean;
};

export const SearchableSelect = <V extends unknown>({
    containerClassName,
    isGroupElement,
    ...props
}: SearchableSelectProps<V>) => {
    const selectRef = useRef<HTMLDivElement>(null);

    return (
        <InputFieldStacked isGroupElement={isGroupElement} isBigger ref={selectRef}>
            <InputField
                as={CoreSearchableSelect<V>}
                dropdownClassName="wallet-select-dropdown"
                assistContainerClassName="empty:hidden"
                originalPlacement="bottom"
                availablePlacements={['bottom']}
                unstyled
                anchorRef={selectRef as MutableRefObject<any>}
                caretIconName="chevron-down"
                caretClassName="stacked-field-caret"
                {...props}
            />
        </InputFieldStacked>
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
