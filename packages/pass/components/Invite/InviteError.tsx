import type { PropsWithChildren } from 'react';
import { Component } from 'react';

import type { MaybeNull } from '@proton/pass/types';

type Props = { onError: () => void };
type State = { hasError: boolean };

/** Error boundary for invite provider views that catches errors and resets internal state.
 * This handles cases where backend resources (shares, items, invites) are deleted/disabled
 * while the user is viewing them, preventing UI crashes and ensuring clean state reset */
export class InviteError extends Component<PropsWithChildren<Props>, State> {
    state = { hasError: false };

    private timer: MaybeNull<NodeJS.Timeout> = null;

    static getDerivedStateFromError(error: unknown) {
        return { hasError: Boolean(error) };
    }

    componentDidCatch() {
        this.props.onError();
        this.timer = setTimeout(() => this.setState({ hasError: false }), 100);
    }

    componentWillUnmount() {
        if (this.timer) clearTimeout(this.timer);
    }

    render() {
        return this.state.hasError ? null : this.props.children;
    }
}
