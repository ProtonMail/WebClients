import { Copy } from '@proton/components';
import { getTitle } from '../../helpers/title';

import mdx from './Copy.mdx';

export default {
    component: Copy,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => <Copy value="Pikachu" onCopy={() => alert(`"Pikachu" copied to clipboard`)} />;
