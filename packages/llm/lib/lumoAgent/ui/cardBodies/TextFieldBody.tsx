import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';

interface Props {
    label: string;
    value: string;
    onChange: (value: string) => void;
    /** Height of the textarea; anything below 2 renders a single-line input instead. */
    rows?: number;
}

/**
 * Shared confirm-card body for a mutation whose params carry one editable string (a name, a script, a
 * signature). Label, value and height arrive as props, so the body stays product-blind and the calling
 * renderer owns which param it maps onto.
 */
const TextFieldBody = ({ label, value, onChange, rows }: Props) => (
    <InputFieldTwo
        label={label}
        value={value}
        onValue={onChange}
        {...(rows && rows > 1 ? { as: TextAreaTwo, rows } : {})}
    />
);

export default TextFieldBody;
