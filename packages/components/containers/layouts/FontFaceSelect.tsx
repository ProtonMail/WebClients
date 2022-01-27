import * as React from 'react';
import { DEFAULT_FONT_FACE, FONT_FACE } from '../../components/editor/constants';
import { Select } from '../../components/select';

interface Props {
    id: string;
    fontFace: string;
    onChange: (value: string) => void;
    loading: boolean;
}

const FontFaceSelect = ({ id, fontFace, onChange, loading, ...rest }: Props) => {
    const options = Object.entries(FONT_FACE).map(([text, value]) => ({ text, value }));

    // FontFace default API value is null and it doesn't trigger default parameter value
    const fontFaceValue = fontFace === undefined || fontFace === null ? DEFAULT_FONT_FACE : fontFace;

    const handleChange = ({ target }: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(target.value);
    };

    return (
        <Select id={id} value={fontFaceValue} options={options} disabled={loading} onChange={handleChange} {...rest} />
    );
};

export default FontFaceSelect;
