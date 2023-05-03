import { jest } from '@jest/globals';

import useModals from '@proton/components/hooks/useModals';

export const mockModals: ReturnType<typeof useModals> = {
    createModal: jest.fn<any>(),
    removeModal: jest.fn(),
    hideModal: jest.fn(),
    getModal: jest.fn<any>(),
    modals: [],
};
