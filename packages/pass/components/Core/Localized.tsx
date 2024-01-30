import type { PropsWithChildren} from 'react';
import { type FC, Fragment, useEffect } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

export const Localized: FC<PropsWithChildren> = ({ children }) => {
    const core = usePassCore();

    useEffect(() => {
        /** get the default user locale on first mount
         * and update `PassCoreProvider::locale` */
        void core.i18n.getLocale().then(core.i18n.setLocale);
    }, []);

    return <Fragment key={core.locale}>{children}</Fragment>;
};
