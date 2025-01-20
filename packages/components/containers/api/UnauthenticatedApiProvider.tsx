import type { ReactNode } from 'react';

import UnauthenticatedApiChallenge from '@proton/components/containers/api/UnauthenticatedApiChallenge';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

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
