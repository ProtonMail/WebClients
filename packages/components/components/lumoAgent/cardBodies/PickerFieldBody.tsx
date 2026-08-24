import Option from '../../option/Option';
import SelectTwo from '../../selectTwo/SelectTwo';
import InputFieldTwo from '../../v2/field/InputField';
import type { CardBodyProps } from '../types';

export interface PickerOption {
    value: string;
    label: string;
}

interface Props extends CardBodyProps {
    /** Which key of `params` this picker edits. */
    field: string;
    label: string;
    /** Resolved by the caller, so the body never learns what the choices mean. */
    options: PickerOption[];
}

/**
 * Confirm-card body offering one choice from a caller-supplied list. Renders nothing when the list is
 * empty — options are resolved at runtime, and a picker with nothing to pick is worse than none; the
 * renderer's `canApply` is what stops an unresolved value being applied.
 */
const PickerFieldBody = ({ params, onChange, field, label, options }: Props) => {
    if (!options.length) {
        return null;
    }

    return (
        <InputFieldTwo
            dense
            as={SelectTwo<string>}
            label={label}
            value={String(params[field] ?? '')}
            onValue={(value: string) => onChange({ ...params, [field]: value })}
        >
            {options.map((option) => (
                <Option key={option.value} value={option.value} title={option.label} />
            ))}
        </InputFieldTwo>
    );
};

export default PickerFieldBody;
