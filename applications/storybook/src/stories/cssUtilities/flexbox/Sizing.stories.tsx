import mdx from './Sizing.mdx';

export default {
    title: 'CSS Utilities/Flexbox/Sizing',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Flex1 = () => {
    return (
        <div className="flex rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="flex-1 bg-info p-4">.flex-1</em>
        </div>
    );
};

export const FlexAuto = () => {
    return (
        <div className="flex rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="flex-auto bg-info p-4">.flex-auto</em>
        </div>
    );
};

export const Grow = () => {
    return (
        <div className="flex rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="grow-2 bg-info p-4">.grow-2</em>
        </div>
    );
};

export const Shrink0 = () => {
    return (
        <div className="flex flex-nowrap rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="shrink-0 bg-info p-4">.shrink-0</em>
        </div>
    );
};

export const Grow0 = () => {
    return (
        <div className="flex flex-nowrap rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="grow-0 bg-info p-4">.grow-0</em>
        </div>
    );
};

export const Grow0Shrink0 = () => {
    return (
        <div className="flex flex-nowrap rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="grow-0 shrink-0 bg-info p-4">static width</em>
        </div>
    );
};

export const FlexNone = () => {
    return (
        <div className="flex flex-nowrap rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="flex-none bg-info p-4">.flex-none</em>
        </div>
    );
};
