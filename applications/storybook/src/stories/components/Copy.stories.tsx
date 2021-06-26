import React from 'react';
import { Copy } from '@proton/components';

import mdx from './Copy.mdx';

export default {
    component: Copy,
    title: 'Components / Copy',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => <Copy value="Pikachu" onCopy={() => alert(`"Pikachu" copied to clipboard`)} />;
