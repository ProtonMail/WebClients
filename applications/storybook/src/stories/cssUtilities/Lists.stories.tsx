import { getTitle } from '../../helpers/title';
import mdx from './Lists.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Lists = () => (
    <div className="w-1/2 self-center">
        <div className="flex gap-7">
            <div>
                <ul className="m-0">
                    <li>Normal</li>
                    <li>list</li>
                </ul>
            </div>
            <div>
                <ul className="unstyled m-0">
                    <li>unstyled</li>
                    <li>list</li>
                </ul>
            </div>
        </div>
    </div>
);
