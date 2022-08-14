import { ChangeEvent, forwardRef, useEffect, useState } from 'react';

import noop from '@proton/utils/noop';

import Input, { Props as InputProps } from './Input';
import useDebounceInput from './useDebounceInput';

/**
 * <SearchInput delay={500} onChange={handleChange} value={keywords} />
 * @param delay used to debounce search value (default: 0)
 * @param onChange returns directly the value and not the event
 * @param value initial
 */
interface Props extends Omit<InputProps, 'onChange'> {
    delay?: number;
    onChange?: (value: string) => void;
    value?: string;
}

const SearchInput = forwardRef<HTMLInputElement, Props>(
    ({ delay = 200, onChange = noop, value = '', ...rest }, ref) => {
        const [keywords, setKeywords] = useState(value);
        const words = useDebounceInput(keywords, delay);

        const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => setKeywords(target.value);

        useEffect(() => {
            onChange(words);
        }, [words]);

        useEffect(() => {
            setKeywords(value);
        }, [value]);

        return <Input ref={ref} value={keywords} onChange={handleChange} type="search" {...rest} />;
    }
);

export default SearchInput;
