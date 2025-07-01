import mdx from './Alignment.mdx';

export default {
    title: 'CSS Utilities/Flexbox/Alignment',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const JustifyStart = () => {
    return (
        <div className="flex justify-start rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const JustifyCenter = () => {
    return (
        <div className="flex justify-center rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const JustifyEnd = () => {
    return (
        <div className="flex justify-end rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const JustifyBetween = () => {
    return (
        <div className="flex justify-space-between rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const JustifyAround = () => {
    return (
        <div className="flex justify-space-around rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const JustifyEvenly = () => {
    return (
        <div className="flex justify-space-evenly rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const ItemsStartColumn = () => {
    return (
        <div className="flex flex-column items-start rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const ItemsCenterColumn = () => {
    return (
        <div className="flex flex-column items-center rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const ItemsEndColumn = () => {
    return (
        <div className="flex flex-column items-end rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const ItemsStart = () => {
    return (
        <div className="flex items-start rounded overflow-hidden border">
            <div className="bg-primary p-8">div</div>
            <span className="bg-primary p-2">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const ItemsEnd = () => {
    return (
        <div className="flex items-end rounded overflow-hidden border">
            <div className="bg-primary p-8">div</div>
            <span className="bg-primary p-2">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const ItemsCenter = () => {
    return (
        <div className="flex items-center rounded overflow-hidden border">
            <div className="bg-primary p-2">div</div>
            <span className="bg-primary p-4 text-2xl">span</span>
            <em className="bg-primary p-4 text-2xs">em</em>
        </div>
    );
};

export const ItemsBaseline = () => {
    return (
        <div className="flex items-baseline rounded overflow-hidden border">
            <div className="bg-primary p-2">div</div>
            <span className="bg-primary p-4 text-2xl">span</span>
            <em className="bg-primary p-4 text-2xs">em</em>
        </div>
    );
};

export const ItemsStretch = () => {
    return (
        <div className="flex items-stretch rounded overflow-hidden border">
            <div className="bg-primary p-2">div</div>
            <span className="bg-primary p-4 text-2xl">span</span>
            <em className="bg-primary p-4 text-2xs">em</em>
        </div>
    );
};

export const SelfCenter = () => {
    return (
        <div className="flex items-start rounded overflow-hidden border">
            <div className="bg-primary p-8">div</div>
            <span className="self-center bg-info p-2">Only this is centered</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const SelfStart = () => {
    return (
        <div className="flex items-end rounded overflow-hidden border">
            <div className="bg-primary p-8">div</div>
            <span className="self-start bg-info p-2">This is aligned to the top</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const SelfEnd = () => {
    return (
        <div className="flex items-start rounded overflow-hidden border">
            <div className="bg-primary p-8">div</div>
            <span className="self-end bg-info p-2">This is aligned to the end</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const SelfStretch = () => {
    return (
        <div className="flex items-start rounded overflow-hidden border">
            <div className="bg-primary p-8">div</div>
            <span className="self-stretch bg-info p-2">This is stretched</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const VerticallyCenterOneItem = () => {
    return (
        <div className="flex rounded overflow-hidden border">
            <div className="m-auto bg-info p-4">I'm a div with class "m-auto"</div>
        </div>
    );
};
