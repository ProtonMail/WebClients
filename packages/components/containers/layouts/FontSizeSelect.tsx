import Option from '@proton/components/components/option/Option';

import { SelectTwo } from '../../components';
import { DEFAULT_FONT_SIZE, FONT_SIZES } from '../../components/editor/constants';

interface Props {
    id: string;
    fontSize: number;
    onChange: (value: number) => void;
    loading: boolean;
}

const options = Object.entries(FONT_SIZES).map(([valueInPx]) => {
    const fontSizeNumber = valueInPx.replace('px', '');
    return { text: fontSizeNumber, value: parseInt(fontSizeNumber, 10) };
});

const FontSizeSelect = ({ id, fontSize, onChange, loading, ...rest }: Props) => {
    const isValid = options.some((option) => fontSize === option.value);
    const fontFaceSize = isValid ? fontSize : DEFAULT_FONT_SIZE;

    return (
        <SelectTwo
            id={id}
            value={fontFaceSize}
            disabled={loading}
            onChange={({ value }) => {
                onChange(value);
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
