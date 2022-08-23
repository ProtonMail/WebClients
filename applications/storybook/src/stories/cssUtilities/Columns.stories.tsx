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
    <div className="w49 flex-align-self-center">
        <ul className="list-2columns on-tablet-list-1column">
            <li>This is</li>
            <li>just</li>
            <li>one</li>
            <li>list</li>
            <li>believe</li>
            <li>me</li>
        </ul>
    </div>
);
