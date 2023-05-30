import { getTitle } from '../../../helpers/title';
import mdx from './Gap.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Gap05 = () => {
    return (
        <div className="flex flex-gap-0-5 rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const Gap1 = () => {
    return (
        <div className="flex flex-gap-1 rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const Gap2 = () => {
    return (
        <div className="flex flex-gap-2 rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const Gap05Column = () => {
    return (
        <div className="flex flex-column flex-gap-0-5 rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const Gap1Column = () => {
    return (
        <div className="flex flex-column flex-gap-1 rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};

export const Gap2Column = () => {
    return (
        <div className="flex flex-column flex-gap-2 rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    );
};
