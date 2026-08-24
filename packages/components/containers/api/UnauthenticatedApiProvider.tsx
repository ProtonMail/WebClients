import type { ReactNode } from 'react';

import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import UnauthenticatedApiChallenge from './UnauthenticatedApiChallenge';
import ApiContext from './apiContext';

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
