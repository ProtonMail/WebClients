import mdx from './Direction.mdx';

export default {
    title: 'CSS Utilities/Flexbox/Direction',
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

Flex.parameters = {
    docs: {
        inlineStories: false,
    },
    layout: 'fullscreen',
};

export const FlexRow = () => (
    <div className="flex flex-row rounded overflow-hidden border">
        <div className="bg-primary p-4">div</div>
        <span className="bg-primary p-4">span</span>
        <em className="bg-primary p-4">em</em>
    </div>
);

export const FlexRowReverse = () => (
    <div className="flex flex-row-reverse rounded overflow-hidden border">
        <div className="bg-primary p-4">div</div>
        <span className="bg-primary p-4">span</span>
        <em className="bg-primary p-4">em</em>
    </div>
);

export const FlexColumn = () => {
    return (
        <div className="flex flex-column rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const FlexColumnReverse = () => (
    <div className="flex flex-column-reverse rounded overflow-hidden border">
        <div className="bg-primary p-4">div</div>
        <span className="bg-primary p-4">span</span>
        <em className="bg-primary p-4">em</em>
    </div>
);

export const FlexWrap = () => (
    <>
        <h3>Default:</h3>
        <div className="flex rounded overflow-hidden border">
            <div className="bg-primary p-4 w-1/5">div</div>
            <span className="bg-primary p-4 w-1/5">span</span>
            <em className="bg-primary p-4 w-1/5">em</em>
            <div className="bg-primary p-4 w-1/5">div</div>
            <span className="bg-primary p-4 w-1/5">span</span>
            <em className="bg-primary p-4 w-1/5">em</em>
        </div>
    </>
);

export const FlexNowrap = () => (
    <>
        <h3>No Wrap:</h3>
        <div className="flex flex-nowrap rounded overflow-hidden border">
            <div className="bg-primary p-4 w-1/5">div</div>
            <span className="bg-primary p-4 w-1/5">span</span>
            <em className="bg-primary p-4 w-1/5">em</em>
            <div className="bg-primary p-4 w-1/5">div</div>
            <span className="bg-primary p-4 w-1/5">span</span>
            <em className="bg-primary p-4 w-1/5">em</em>
        </div>
    </>
);
