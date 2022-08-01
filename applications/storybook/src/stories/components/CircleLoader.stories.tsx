import { CircleLoader } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './CircleLoader.mdx';

export default {
    component: CircleLoader,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => (
    <>
        <CircleLoader />
        <br />
        <CircleLoader size="medium" className="color-primary" />
        <br />
        <CircleLoader size="large" />
    </>
);
