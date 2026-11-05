import type { ReactNode } from 'react';
import { Component } from 'react';

import { traceError } from '@proton/shared/lib/helpers/sentry';

interface Props {
    /** Raw markdown, shown as plain text if rendering it throws (e.g. "too much recursion"). */
    content: string;
    children: ReactNode;
}

interface State {
    hasError: boolean;
    content: string;
}

/**
 * Keeps a markdown parse/render failure (stack overflow, malformed model output) from taking down the
 * whole conversation view. Resets as soon as the content changes, so streaming can recover.
 */
export class MarkdownErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, content: this.props.content };

    static getDerivedStateFromError(): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        // Report the error name and message only, never `content`: it is decrypted conversation text.
        const reported = new Error(`MarkdownErrorBoundary: ${error?.name}: ${error?.message}`);
        reported.name = 'MarkdownRenderError';
        traceError(reported);
    }

    static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
        return props.content !== state.content ? { hasError: false, content: props.content } : null;
    }

    render() {
        if (this.state.hasError) {
            return <div className="whitespace-pre-wrap break-word">{this.props.content}</div>;
        }
        return this.props.children;
    }
}
