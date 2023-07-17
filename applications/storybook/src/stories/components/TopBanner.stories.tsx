import { TopBanner } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './TopBanner.mdx';

export default {
    component: TopBanner,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    return <TopBanner className="bg-danger">Example of a top banner</TopBanner>;
};

export const Close = () => {
    return (
        <TopBanner className="bg-danger" onClose={() => alert('Close button pressed')}>
            Example of a top banner with close button
        </TopBanner>
    );
};

export const Color = () => {
    return (
        <div className="flex flex-column gap-2">
            <TopBanner className="bg-norm">Banner with norm background</TopBanner>
            <TopBanner className="bg-weak">Banner with weak background</TopBanner>
            <TopBanner className="bg-strong">Banner with strong background</TopBanner>
            <TopBanner className="bg-primary">Banner with primary background</TopBanner>
            <TopBanner className="bg-danger">Banner with danger background</TopBanner>
            <TopBanner className="bg-warning">Banner with warning background</TopBanner>
            <TopBanner className="bg-success">Banner with success background</TopBanner>
            <TopBanner className="bg-info">Banner with info background</TopBanner>
            <TopBanner>Banner with no background</TopBanner>
        </div>
    );
};
