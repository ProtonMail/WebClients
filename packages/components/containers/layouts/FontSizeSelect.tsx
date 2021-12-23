import * as React from 'react';
import { DEFAULT_FONT_SIZE, FONT_SIZES } from '../../components/editor/constants';
import { Select } from '../../components/select';

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

    const handleChange = ({ target }: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(parseInt(target.value, 10));
    };

    return (
        <Select id={id} value={fontFaceSize} options={options} disabled={loading} onChange={handleChange} {...rest} />
    );
};

export default FontSizeSelect;
