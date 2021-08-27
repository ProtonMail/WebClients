import { Collapsible } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Collapsible.mdx';

export default {
    component: Collapsible,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = ({ ...args }) => (
    <Collapsible headerContent={<span>I am but a header</span>} {...args}>
        <h3>This is the content</h3>
        <p>And it&#39;s grrrrrreat!</p>
    </Collapsible>
);
