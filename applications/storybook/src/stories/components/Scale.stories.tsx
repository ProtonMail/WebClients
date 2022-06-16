import { useState } from 'react';
import { EmojiScale, Scale } from '@proton/components';
import { getTitle } from '../../helpers/title';

import mdx from './Scale.mdx';

export default {
    component: Scale,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [value, setValue] = useState<number>();

    const handleChange = (v: number) => {
        setValue(v);
    };

    return (
        <Scale
            from={0}
            to={10}
            fromLabel="0 - Not at all likely"
            toLabel="10 - Extremely likely"
            value={value}
            onChange={handleChange}
        />
    );
};

export const Emoji = () => {
    const [value, setValue] = useState<number>();

    const handleChange = (v: number) => {
        setValue(v);
    };

    return <EmojiScale fromLabel="Awful" toLabel="Wonderful" value={value} onChange={handleChange} />;
};
