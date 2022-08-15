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
    <div className="w49 flex-align-self-center">
        <div className="flex-autogrid">
            <div className="flex-autogrid-item">
                <ul className="m0">
                    <li>Normal</li>
                    <li>list</li>
                </ul>
            </div>
            <div className="flex-autogrid-item">
                <ul className="unstyled m0">
                    <li>unstyled</li>
                    <li>list</li>
                </ul>
            </div>
        </div>
    </div>
);
