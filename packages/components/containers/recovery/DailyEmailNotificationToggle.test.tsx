import { fireEvent, render, waitFor } from '@testing-library/react';

import DailyEmailNotificationToggle from './DailyEmailNotificationToggle';

describe('DailyEmailNotificationToggle', () => {
    describe('when annot enable', () => {
        it('should have disabled attribute', () => {
            const { container } = render(
                <DailyEmailNotificationToggle
                    canEnable={false}
                    isEnabled={false}
                    onChange={jest.fn()}
                    id="test-toggle"
                />
            );

            const input = container.querySelector('#test-toggle');
            expect(input).toHaveAttribute('disabled', '');
        });
    });

    describe('when can enable', () => {
        it('should check checkbox if enabled', () => {
            const { container } = render(
                <DailyEmailNotificationToggle canEnable={true} isEnabled={true} onChange={jest.fn()} id="test-toggle" />
            );

            const input = container.querySelector('#test-toggle');
            expect(input).not.toHaveAttribute('disabled');
            expect(input).toHaveAttribute('checked', '');
        });

        it('should emit onChange on click', async () => {
            const mockOnChange = jest.fn();
            const { container } = render(
                <DailyEmailNotificationToggle
                    canEnable={true}
                    isEnabled={true}
                    onChange={mockOnChange}
                    id="test-toggle"
                />
            );

            const input = container.querySelector('#test-toggle');
            await fireEvent.click(input as HTMLElement);

            await waitFor(() => expect(mockOnChange).toHaveBeenCalledTimes(1));
        });
    });
});
