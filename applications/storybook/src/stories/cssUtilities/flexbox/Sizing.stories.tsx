import { getTitle } from '../../../helpers/title';
import mdx from './Sizing.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const FlexItemFluid = () => {
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

export const FlexItemFluidAuto = () => {
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

export const FlexItemGrow = () => {
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

export const FlexItemNoShrink = () => {
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

export const FlexItemNoGrow = () => {
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

export const FlexItemNoGrowNoShrink = () => {
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

export const FlexItemNoFlex = () => {
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
