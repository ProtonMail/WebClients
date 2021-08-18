import { useState, useEffect } from 'react';
import { Progress } from '@proton/components';
import { getTitle } from '../../helpers/title';

import mdx from './Progress.mdx';

export default {
    component: Progress,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [value, setValue] = useState(0);
    const increment = () => setValue(value + 5);
    const className = value < 50 ? 'progress-bar--warning' : 'progress-bar--error';

    useEffect(() => {
        const intervalID = setInterval(increment, 5000);

        return () => {
            clearInterval(intervalID);
        };
    }, []);

    return <Progress value={value} className={className} />;
};
