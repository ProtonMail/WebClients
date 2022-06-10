import * as React from 'react';
import { SelectTwo, Option } from '../../components';
import { DEFAULT_FONT_SIZE, FONT_SIZES } from '../../components/editor/constants';

interface Props {
    id: string;
    fontSize: number;
    onChange: (value: number) => void;
    loading: boolean;
}

const FontSizeSelect = ({ id, fontSize, onChange, loading, ...rest }: Props) => {
    const options = Object.entries(FONT_SIZES).map(([valueInPx]) => {
        const fontSizeNumber = valueInPx.replace('px', '');
        return { text: fontSizeNumber, value: fontSizeNumber };
    });

    // FontFace default API value is null and it doesn't trigger default parameter value
    const fontFaceSize = fontSize === undefined || fontSize === null ? DEFAULT_FONT_SIZE : fontSize;

    return (
        <SelectTwo
            id={id}
            value={fontFaceSize}
            disabled={loading}
            onChange={({ value }) => {
                onChange(typeof value === 'string' ? parseInt(value, 10) : value);
            }}
            {...rest}
        >
            {options.map(({ text, value }) => (
                <Option key={value} value={value} title={text} />
            ))}
        </SelectTwo>
    );
};

export default FontSizeSelect;
