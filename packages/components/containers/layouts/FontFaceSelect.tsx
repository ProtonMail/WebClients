import Option from '@proton/components/components/option/Option';

import { SelectTwo } from '../../components';
import { DEFAULT_FONT_FACE, FONT_FACES } from '../../components/editor/constants';

interface Props {
    id: string;
    fontFace: string;
    onChange: (value: string) => void;
    loading: boolean;
}

const options = Object.values(FONT_FACES).map(({ label: text, value }) => ({ text, value: value.toLowerCase() }));

const FontFaceSelect = ({ id, fontFace, onChange, loading, ...rest }: Props) => {
    const isValid = fontFace && options.some((option) => option.value === fontFace.toLowerCase());
    // FontFace default API value is null and it doesn't trigger default parameter value
    const fontFaceValue = isValid ? fontFace.toLowerCase() : DEFAULT_FONT_FACE.toLowerCase();

    return (
        <SelectTwo
            id={id}
            value={fontFaceValue}
            disabled={loading}
            onChange={({ value: selectedValue }) => {
                const option = Object.values(FONT_FACES).find(({ value }) => value.toLowerCase() === selectedValue);

                if (option) {
                    onChange(option.value);
                }
            }}
            {...rest}
        >
            {options.map(({ text, value }) => (
                <Option key={value} title={text} value={value} />
            ))}
        </SelectTwo>
    );
};

export default FontFaceSelect;
