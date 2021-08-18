import { MiddleEllipsis } from '@proton/components';
import { getTitle } from '../../helpers/title';

import mdx from './MiddleEllipsis.mdx';

export default {
    component: MiddleEllipsis,
    title: getTitle(__filename, false),
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
