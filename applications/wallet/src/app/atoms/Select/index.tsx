import Option from '@proton/components/components/option/Option';
import SelectTwo, { Props as SelectTwoProps } from '@proton/components/components/selectTwo/SelectTwo';
import InputField, { InputFieldOwnProps } from '@proton/components/components/v2/field/InputField';

import './Select.scss';

type Props<V> = Omit<
    SelectTwoProps<V> & InputFieldOwnProps,
    'children' | 'assistContainerClassName' | 'labelContainerClassName' | 'originalPlacement' | 'unstyled'
> & {
    options: { id: string; value: V; label: string }[];
    label: string | JSX.Element;
};

export const Select = <V extends unknown>({ options, ...props }: Props<V>) => {
    return (
        <div className="wallet-select bg-weak py-5 px-6 rounded-xl color-norm w-full">
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
                    <Option key={opt.id} title={opt.label} value={opt.value} />
                ))}
            </InputField>
        </div>
    );
};
