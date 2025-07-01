import { Checkbox } from '@proton/components';

import mdx from './ExpandClickArea.mdx';

export default {
    title: 'CSS Utilities/Expand Click Area',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const ExpandClickArea = () => (
    <div className="relative p-7 bg-weak">
        <Checkbox className="expand-click-area mr-2" />
        parent element (grey background)
    </div>
);
