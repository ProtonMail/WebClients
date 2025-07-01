/* eslint-disable jsx-a11y/anchor-is-valid */
import mdx from './InteractiveFocusHelper.mdx';

export default {
    title: 'CSS Utilities/Interactive Focus Helper',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Interactive = () => (
    <a href="#" className="interactive p-2 border rounded">
        Focus me
    </a>
);

export const InteractivePseudo = () => (
    <a href="#" className="interactive-pseudo relative p-2">
        Focus me
    </a>
);

export const InteractivePseudoInset = () => (
    <div className="overflow-hidden border border-weak">
        <a href="#" className="interactive-pseudo-inset block w-full relative p-2">
            Focus me
        </a>
    </div>
);

export const InteractivePseudoProtrude = () => (
    <a href="#" className="interactive-pseudo-protrude interactive--no-background bg-primary relative">
        Focus me
    </a>
);

export const InteractiveNoBackground = () => (
    <a href="#" className="interactive interactive--no-background bg-none p-2 border rounded">
        Focus me
    </a>
);
