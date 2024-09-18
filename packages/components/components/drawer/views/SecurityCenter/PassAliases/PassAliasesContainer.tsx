import { Suspense, lazy } from 'react';

import Loader from '@proton/components/components/loader/Loader';

const PassAliases = lazy(
    () => import(/* webpackChunkName: "SecurityCenterPassAliases", webpackPreload: true */ './PassAliases')
);

/** Lazy load PassAliases main component */
const PassAliasesContainer = () => {
    return (
        <Suspense fallback={<Loader size="large" />}>
            <PassAliases />
        </Suspense>
    );
};

export default PassAliasesContainer;
