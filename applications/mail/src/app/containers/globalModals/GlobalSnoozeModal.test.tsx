import { type ReactNode } from 'react';

import { render, screen } from '@testing-library/react';

import { GlobalModalContext } from './GlobalModalProvider';
import { GlobalSnoozeModal } from './GlobalSnoozeModal';
import { ModalType } from './inteface';

const notifyMock = jest.fn();
const subscribeMock = jest.fn();

const wrapper = ({ children }: { children: ReactNode }) => (
    <GlobalModalContext.Provider value={{ notify: notifyMock, subscribe: subscribeMock }}>
        {children}
    </GlobalModalContext.Provider>
);

describe('GlobalSnoozeModal', () => {
    it('should open the modal when the snooze event is sent', () => {
        subscribeMock.mockImplementation((callback) => {
            callback({
                type: ModalType.Snooze,
                value: {
                    onConfirm: jest.fn(),
                },
            });
        });
        render(<GlobalSnoozeModal />, { wrapper });

        expect(screen.getByTestId('confirm-button')).toBeInTheDocument();
    });

    it.each([ModalType.Schedule, ModalType.Unsubscribe])(
        'should not open the modal when the %s event is sent',
        (modalType) => {
            subscribeMock.mockImplementation((callback) => {
                callback({
                    type: modalType,
                    value: {
                        onConfirm: jest.fn(),
                    },
                });
            });
            render(<GlobalSnoozeModal />, { wrapper });

            expect(screen.queryByTestId('confirm-button')).not.toBeInTheDocument();
        }
    );
});
