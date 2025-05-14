import type { PropsWithChildren } from 'react';
import { type FC, Fragment, useEffect, useState } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import noop from '@proton/utils/noop';

/** Trigger localization change through the React "key" technique to induce a
 * re-render of the specific sub-tree, avoiding a full reload. Note that this
 * approach may lead to re-initializing each child component to its initial state,
 * potentially causing a loss of the current context. */
export const Localized: FC<PropsWithChildren> = ({ children }) => {
    const core = usePassCore();
    const [ready, setReady] = useState(false);
    const [appLocale, setAppLocale] = useState(core.i18n.getDefaultLocale());

    useEffect(() => {
        core.i18n.subscribe(({ locale }) => setAppLocale(locale));
        core.i18n
            .setLocale()
            .catch(noop)
            .finally(() => setReady(true));
    }, []);

    return <Fragment key={appLocale}>{ready && children}</Fragment>;
};
