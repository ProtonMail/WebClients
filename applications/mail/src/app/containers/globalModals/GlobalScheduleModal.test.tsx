import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';

import { GlobalModalContext } from './GlobalModalProvider';
import { GlobalScheduleModal } from './GlobalScheduleModal';
import { ModalType } from './inteface';

const notifyMock = jest.fn();
const subscribeMock = jest.fn();

const wrapper = ({ children }: { children: ReactNode }) => (
    <GlobalModalContext.Provider value={{ notify: notifyMock, subscribe: subscribeMock }}>
        {children}
    </GlobalModalContext.Provider>
);

describe('GlobalScheduleModal', () => {
    it('should open the modal when the schedule event is sent', () => {
        subscribeMock.mockImplementation((callback) => {
            callback({
                type: ModalType.Schedule,
                value: {
                    isMessage: true,
                    onConfirm: jest.fn(),
                },
            });
        });
        render(<GlobalScheduleModal />, { wrapper });

        expect(screen.getByTestId('confirm-button')).toBeInTheDocument();
    });

    it.each([ModalType.Snooze, ModalType.Unsubscribe])(
        'should not open the modal when the %s event is sent',
        (modalType) => {
            subscribeMock.mockImplementation((callback) => {
                callback({
                    type: modalType,
                    value: {
                        isMessage: true,
                        onConfirm: jest.fn(),
                    },
                });
            });
            render(<GlobalScheduleModal />, { wrapper });

            expect(screen.queryByTestId('confirm-button')).not.toBeInTheDocument();
        }
    );
});
