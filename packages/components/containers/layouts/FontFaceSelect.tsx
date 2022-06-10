import * as React from 'react';
import { SelectTwo, Option } from '../../components';
import { DEFAULT_FONT_FACE, FONT_FACES } from '../../components/editor/constants';

interface Props {
    id: string;
    fontFace: string;
    onChange: (value: string) => void;
    loading: boolean;
}

const FontFaceSelect = ({ id, fontFace, onChange, loading, ...rest }: Props) => {
    const options = Object.values(FONT_FACES).map(({ label: text, value }) => ({ text, value }));

    // FontFace default API value is null and it doesn't trigger default parameter value
    const fontFaceValue = fontFace === undefined || fontFace === null ? DEFAULT_FONT_FACE : fontFace;

    return (
        <SelectTwo
            id={id}
            value={fontFaceValue}
            disabled={loading}
            onChange={({ value }) => {
                onChange(value);
            }}
            {...rest}
        >
            {options.map(({ text, value }) => (
                <Option title={text} value={value} />
            ))}
        </SelectTwo>
    );
};

export default FontFaceSelect;
