import { Checkbox } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './IncreaseClickSurface.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const IncreaseClickSurface = () => (
    <div className="relative p-7 bg-weak">
        <Checkbox className="increase-click-surface" />
        parent element (grey background)
    </div>
);
