import { Button } from '@proton/atoms';

import { getTitle } from '../../helpers/title';
import mdx from './OpacityOnHover.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const OpacityOnHover = () => (
    <div className="group-hover-opacity-container">
        hover or focus me, pikaaaaa…
        <Button className="ml-4 group-hover:opacity-100">CHU</Button>
    </div>
);

export const OpacityOnHoverNoWidth = () => (
    <div className="group-hover-opacity-container">
        This is the group container, hover me
        <Button className="ml-4 group-hover:opacity-100 group-hover:opacity-100-no-width">Hidden Button</Button>
        <Button type="button" className="ml-4">
            Button
        </Button>
    </div>
);
