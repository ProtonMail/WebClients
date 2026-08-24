import type { ReactNode } from 'react';

import { ApiContext } from '@proton/app-context/apiContext';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import UnauthenticatedApiChallenge from './UnauthenticatedApiChallenge';

interface Props {
    children: ReactNode;
    unauthenticatedApi: UnauthenticatedApi;
}

const UnauthenticatedApiProvider = ({ unauthenticatedApi, children }: Props) => {
    return (
        <>
            <UnauthenticatedApiChallenge unauthenticatedApi={unauthenticatedApi} />
            <ApiContext.Provider value={unauthenticatedApi.apiCallback}>{children}</ApiContext.Provider>
        </>
    );
};

export default UnauthenticatedApiProvider;
