import type { PropsWithChildren } from 'react';
import { type FC, Fragment, useEffect, useState } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { DEFAULT_LOCALE } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

/** Trigger localization change through the React "key" technique to induce a
 * re-render of the specific sub-tree, avoiding a full reload. Note that this
 * approach may lead to re-initializing each child component to its initial state,
 * potentially causing a loss of the current context. */
export const Localized: FC<PropsWithChildren> = ({ children }) => {
    const core = usePassCore();
    const [appLocale, setAppLocale] = useState(DEFAULT_LOCALE);

    useEffect(() => {
        core.i18n.setLocale().catch(noop);
        core.i18n.subscribe(({ locale }) => setAppLocale(locale));
    }, []);

    return <Fragment key={appLocale}>{children}</Fragment>;
};
