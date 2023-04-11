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
        <div className="flex flex-gap-2">
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