import mdx from './Flex.mdx';

export default {
    title: 'CSS Utilities/Flexbox/Flex',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Flex = () => (
    <div className="flex rounded overflow-hidden border">
        <div className="bg-primary p-4">div</div>
        <span className="bg-primary p-4">span</span>
        <em className="bg-primary p-4">em</em>
    </div>
);

export const InlineFlex = () => (
    <div className="inline-flex rounded overflow-hidden border">
        <div className="bg-primary p-4">div</div>
        <span className="bg-primary p-4">span</span>
        <em className="bg-primary p-4">em</em>
    </div>
);
