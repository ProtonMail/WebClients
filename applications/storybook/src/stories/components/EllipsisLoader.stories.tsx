import { EllipsisLoader } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './EllipsisLoader.mdx';

export default {
    component: EllipsisLoader,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => <EllipsisLoader />;
