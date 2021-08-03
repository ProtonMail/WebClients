import { MiddleEllipsis } from '@proton/components';

import mdx from './MiddleEllipsis.mdx';

export default {
    component: MiddleEllipsis,
    title: 'Components / Middle Ellipsis',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const textToEllipsis = `mySuperLoooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooongFile.jpg`;

export const Basic = () => <MiddleEllipsis text={textToEllipsis} />;
export const Title = () => <MiddleEllipsis displayTitle={false} text={textToEllipsis} />;
export const Classes = () => <MiddleEllipsis className="w50" text={textToEllipsis} />;
