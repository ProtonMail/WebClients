import { useState } from 'react';
import { Toggle, useLoading } from '@proton/components';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getTitle } from '../../helpers/title';

import mdx from './Toggle.mdx';

export default {
    component: Toggle,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [state, setState] = useState(true);
    return <Toggle checked={state} onChange={() => setState(!state)} />;
};

export const Loading = () => {
    const [state, setState] = useState(false);
    const [loading, withLoading] = useLoading(true);

    return (
        <Toggle
            checked={state}
            loading={loading}
            onChange={() => {
                const run = async () => {
                    await wait(500);
                    setState((old) => !old);
                };
                withLoading(run());
            }}
        />
    );
};

export const Disabled = () => {
    return <Toggle checked disabled />;
};
