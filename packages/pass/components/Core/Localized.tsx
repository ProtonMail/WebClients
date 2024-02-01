import type { PropsWithChildren } from 'react';
import { type FC, Fragment } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

/** Trigger localization change through the React "key" technique to induce a
 * re-render of the specific sub-tree, avoiding a full reload. Note that this
 * approach may lead to re-initializing each child component to its initial state,
 * potentially causing a loss of the current context. */
export const Localized: FC<PropsWithChildren> = ({ children }) => {
    const core = usePassCore();
    return <Fragment key={core.locale}>{children}</Fragment>;
};
