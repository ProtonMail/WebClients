import { getTitle } from '../../helpers/title';
import mdx from './Columns.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Columns = () => (
    <div className="w-1/2 flex-align-self-center">
        <ul className="list-columns md:column-2">
            <li>This is</li>
            <li>just</li>
            <li>one</li>
            <li>list</li>
            <li>believe</li>
            <li>me</li>
        </ul>
    </div>
);
