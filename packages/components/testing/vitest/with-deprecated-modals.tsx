import type { ComponentType, JSX } from 'react';

import { vi } from 'vitest';

import ModalsContext from '../../containers/modals/modalsContext';
import type useModals from '../../hooks/useModals';

const mockModals: ReturnType<typeof useModals> = {
    createModal: vi.fn(),
    removeModal: vi.fn(),
    hideModal: vi.fn(),
    getModal: vi.fn(),
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
