import mdx from './Responsive.mdx';

export default {
    title: 'CSS Utilities/Flexbox/Responsive',
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
        <div className="flex gap-2 justify-space-between flex-column md:flex-row rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
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
        <div className="flex gap-2 justify-space-between flex-column lg:flex-row rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
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
        <div className="flex gap-0 md:gap-4 rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

FlexGap0.parameters = {
    docs: {
        iframeHeight: '100px',
    },
};
