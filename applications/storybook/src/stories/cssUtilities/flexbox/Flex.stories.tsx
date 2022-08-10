import { getTitle } from '../../../helpers/title';
import mdx from './Flex.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Flex = () => (
    <div className="flex rounded overflow-hidden border">
        <div className="bg-primary p1">div</div>
        <span className="bg-primary p1">span</span>
        <em className="bg-primary p1">em</em>
    </div>
);
