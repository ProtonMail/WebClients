import { Checkbox } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './ExpandClickArea.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const ExpandClickArea = () => (
    <div className="relative p-7 bg-weak">
        <Checkbox className="expand-click-area" />
        parent element (grey background)
    </div>
);
