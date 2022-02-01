import { jest } from '@jest/globals';
import { useModals } from '@proton/components';

export const mockModals: ReturnType<typeof useModals> = {
    createModal: jest.fn(),
    removeModal: jest.fn(),
    hideModal: jest.fn(),
    getModal: jest.fn(),
    modals: [],
};
