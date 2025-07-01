import { EllipsisLoader } from '@proton/components';

import mdx from './EllipsisLoader.mdx';

export default {
    component: EllipsisLoader,
    title: 'Components/Ellipsis Loader',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => <EllipsisLoader />;
