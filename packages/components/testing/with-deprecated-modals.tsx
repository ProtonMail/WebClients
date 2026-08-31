import type { ComponentType } from 'react';

import { jest } from '@jest/globals';

import ModalsContext from '../containers/modals/modalsContext';
import type useModals from '../hooks/useModals';

export const mockModals: ReturnType<typeof useModals> = {
    createModal: jest.fn<any>(),
    removeModal: jest.fn(),
    hideModal: jest.fn(),
    getModal: jest.fn<any>(),
    modals: [],
};

export const withDeprecatedModals =
    (value = mockModals) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function DeprecatedModalsProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <ModalsContext.Provider value={value}>
                    <Component {...props} />
                </ModalsContext.Provider>
            );
        };
