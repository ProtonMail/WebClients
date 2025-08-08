import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';

import { GlobalModalContext } from './GlobalModalProvider';
import { GlobalUnsubscribeModal } from './GlobalUnsubscribeModal';
import { ModalType } from './inteface';

const notifyMock = jest.fn();
const subscribeMock = jest.fn();

const wrapper = ({ children }: { children: ReactNode }) => (
    <GlobalModalContext.Provider value={{ notify: notifyMock, subscribe: subscribeMock }}>
        {children}
    </GlobalModalContext.Provider>
);

describe('GlobalUnsubscribeModal', () => {
    it('should open the modal when the snooze event is sent', () => {
        subscribeMock.mockImplementation((callback) => {
            callback({
                type: ModalType.Unsubscribe,
                value: {
                    isMessage: true,
                    elementLength: 10,
                    onConfirm: jest.fn(),
                },
            });
        });
        render(<GlobalUnsubscribeModal />, { wrapper });

        expect(screen.getByTestId('confirm-spam-unsub-button')).toBeInTheDocument();
    });

    it.each([ModalType.Schedule, ModalType.Snooze])(
        'should not open the modal when the %s event is sent',
        (modalType) => {
            subscribeMock.mockImplementation((callback) => {
                callback({
                    type: modalType,
                    value: {
                        isMessage: true,
                        elementLength: 10,
                        onConfirm: jest.fn(),
                    },
                });
            });
            render(<GlobalUnsubscribeModal />, { wrapper });

            expect(screen.queryByTestId('confirm-spam-unsub-button')).not.toBeInTheDocument();
        }
    );
});
