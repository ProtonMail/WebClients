import Collapsible, { Props as CollapsibleProps } from '@proton/components/components/collapsible/Collapsible';

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

export const Playground = (args: CollapsibleProps) => <Collapsible {...args} />;
const args: CollapsibleProps = {
    children:
        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero, blanditiis quos?',
    headerContent: 'Header content',
};
Playground.args = args;
Playground.argTypes = {
    headerContent: {
        type: { name: 'string' },
    },
};

export const Basic = ({ ...args }) => (
    <Collapsible headerContent={<h3 className="mb0">I am but a header</h3>} expandByDefault {...args}>
        <p>This is the content</p>
        <p>And it&#39;s grrrrrreat!</p>
    </Collapsible>
);
