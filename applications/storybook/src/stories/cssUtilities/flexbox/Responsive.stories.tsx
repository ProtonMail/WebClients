import { getTitle } from '../../../helpers/title';
import mdx from './Responsive.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
            inlineStories: false,
        },
        layout: 'fullscreen',
    },
};

export const ColumnMobile = () => {
    return (
        <div className="flex flex-gap-0-5 flex-justify-space-between on-mobile-flex-column on-mobile-flex-column-no-stretch rounded overflow-hidden border">
            <div className="bg-primary p1">div</div>
            <span className="bg-primary p1">span</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

ColumnMobile.parameters = {
    docs: {
        iframeHeight: '200px',
    },
};

export const ColumnTablet = () => {
    return (
        <div className="flex flex-gap-0-5 flex-justify-space-between on-tablet-flex-column rounded overflow-hidden border">
            <div className="bg-primary p1">div</div>
            <span className="bg-primary p1">span</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

ColumnTablet.parameters = {
    docs: {
        iframeHeight: '200px',
    },
};

export const FlexGap0 = () => {
    return (
        <div className="flex flex-gap-1 on-mobile-flex-gap-0 rounded overflow-hidden border">
            <div className="bg-primary p1">div</div>
            <span className="bg-primary p1">span</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

FlexGap0.parameters = {
    docs: {
        iframeHeight: '100px',
    },
};
