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
        <button type="button" className="button ml-4 button-outline-weak group-hover:opacity-100">
            CHU
        </button>
    </div>
);

export const OpacityOnHoverNoWidth = () => (
    <div className="group-hover-opacity-container">
        This is the group container, hover me
        <button
            type="button"
            className="button ml-4 button-outline-weak group-hover:opacity-100 group-hover:opacity-100-no-width"
        >
            Hidden Button
        </button>
        <button type="button" className="button ml-4 button-outline-weak">
            Button
        </button>
    </div>
);
