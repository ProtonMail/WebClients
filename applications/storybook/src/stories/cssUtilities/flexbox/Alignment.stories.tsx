import { getTitle } from '../../../helpers/title';
import mdx from './Alignment.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const JustifyBetween = () => {
    return (
        <div className="flex flex-justify-space-between rounded overflow-hidden border">
            <div className="bg-primary p1">div</div>
            <span className="bg-primary p1">span</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

export const JustifyAround = () => {
    return (
        <div className="flex flex-justify-space-around rounded overflow-hidden border">
            <div className="bg-primary p1">div</div>
            <span className="bg-primary p1">span</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

export const JustifyEnd = () => {
    return (
        <div className="flex flex-justify-end rounded overflow-hidden border">
            <div className="bg-primary p1">div</div>
            <span className="bg-primary p1">span</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

export const JustifyCenter = () => {
    return (
        <div className="flex flex-justify-center rounded overflow-hidden border">
            <div className="bg-primary p1">div</div>
            <span className="bg-primary p1">span</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

export const AlignItemsCenterColumn = () => {
    return (
        <div className="flex flex-column flex-align-items-center rounded overflow-hidden border">
            <div className="bg-primary p1">div</div>
            <span className="bg-primary p1">span</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

export const AlignItemsEndColumn = () => {
    return (
        <div className="flex flex-column flex-align-items-end rounded overflow-hidden border">
            <div className="bg-primary p1">div</div>
            <span className="bg-primary p1">span</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

export const AlignItemsStart = () => {
    return (
        <div className="flex flex-align-items-start rounded overflow-hidden border">
            <div className="bg-primary p2">div</div>
            <span className="bg-primary p0-5">span</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

export const AlignItemsEnd = () => {
    return (
        <div className="flex flex-align-items-end rounded overflow-hidden border">
            <div className="bg-primary p2">div</div>
            <span className="bg-primary p0-5">span</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

export const AlignItemsCenter = () => {
    return (
        <div className="flex flex-align-items-center rounded overflow-hidden border">
            <div className="bg-primary p0-5">div</div>
            <span className="bg-primary p1 text-2xl">span</span>
            <em className="bg-primary p1 text-2xs">em</em>
        </div>
    );
};

export const AlignItemsBaseline = () => {
    return (
        <div className="flex flex-align-items-baseline rounded overflow-hidden border">
            <div className="bg-primary p0-5">div</div>
            <span className="bg-primary p1 text-2xl">span</span>
            <em className="bg-primary p1 text-2xs">em</em>
        </div>
    );
};

export const AlignItemsStretch = () => {
    return (
        <div className="flex flex-align-items-stretch rounded overflow-hidden border">
            <div className="bg-primary p0-5">div</div>
            <span className="bg-primary p1 text-2xl">span</span>
            <em className="bg-primary p1 text-2xs">em</em>
        </div>
    );
};

export const AlignItemCenter = () => {
    return (
        <div className="flex flex-align-items-start rounded overflow-hidden border">
            <div className="bg-primary p2">div</div>
            <span className="flex-align-self-center bg-info p0-5">Only this is centered</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

export const AlignItemStart = () => {
    return (
        <div className="flex flex-align-items-end rounded overflow-hidden border">
            <div className="bg-primary p2">div</div>
            <span className="flex-align-self-start bg-info p0-5">This is aligned to the top</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

export const AlignItemEnd = () => {
    return (
        <div className="flex flex-align-items-start rounded overflow-hidden border">
            <div className="bg-primary p2">div</div>
            <span className="flex-align-self-end bg-info p0-5">This is aligned to the end</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

export const AlignItemStretch = () => {
    return (
        <div className="flex flex-align-items-start rounded overflow-hidden border">
            <div className="bg-primary p2">div</div>
            <span className="flex-align-self-stretch bg-info p0-5">This is stretched</span>
            <em className="bg-primary p1">em</em>
        </div>
    );
};

export const VerticallyCenterOneItem = () => {
    return (
        <div className="flex rounded overflow-hidden border">
            <div className="m-auto bg-info p1">I'm a div with class "m-auto"</div>
        </div>
    );
};
