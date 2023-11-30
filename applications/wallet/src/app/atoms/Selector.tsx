import { Label, Option, SelectTwo } from '@proton/components/components';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';

interface Props<TSelectValue extends string | number, TOption extends { label: string; value: TSelectValue }> {
    id: string;
    label: string;
    selected: TSelectValue;
    onSelect: (event: SelectChangeEvent<TSelectValue>) => void;
    options: TOption[];
}

export const Selector = <TSelectValue extends string | number, TOption extends { label: string; value: TSelectValue }>({
    id,
    label,
    selected,
    onSelect,
    options,
}: Props<TSelectValue, TOption>) => {
    return (
        <div className="mr-6 w-3/10">
            <Label className="text-semibold">{label}</Label>
            <SelectTwo title={label} className="mt-2" id={id} data-testid={id} value={selected} onChange={onSelect}>
                {options.map((option) => (
                    <Option key={option.value} value={option.value} title={option.label} data-testid={`${id}-option`}>
                        {option.label}
                    </Option>
                ))}
            </SelectTwo>
        </div>
    );
};
