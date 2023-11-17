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
            <em className="flex-item-fluid bg-info p-4">.flex-item-fluid</em>
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
            <em className="flex-item-grow-2 bg-info p-4">.flex-item-grow-2</em>
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
            <em className="flex-item-noshrink bg-info p-4">.flex-item-noshrink</em>
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
            <em className="flex-item-nogrow bg-info p-4">.flex-item-nogrow</em>
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
            <em className="flex-item-nogrow flex-item-noshrink bg-info p-4">static width</em>
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
            <em className="flex-item-noflex bg-info p-4">.flex-item-noflex</em>
        </div>
    );
};
