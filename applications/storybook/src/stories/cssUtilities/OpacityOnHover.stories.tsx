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
    <div className="opacity-on-hover-container">
        hover or focus me, pikaaaaa…
        <button type="button" className="button ml-4 button-outline-weak opacity-on-hover">
            CHU
        </button>
    </div>
);