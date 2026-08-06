import type { ComponentType } from 'react';

import ApiContext from '@proton/components/containers/api/apiContext';

import { apiMock } from '../../api';

export const withApi =
    (api = apiMock) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function ApiProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <ApiContext.Provider value={api}>
                    <Component {...props} />
                </ApiContext.Provider>
            );
        };
