import { act, fireEvent, render, screen } from '@testing-library/react';

import type { ChargebeeIdealProcessorHook } from '@proton/components/payments/react-extensions/useChargebeeIdeal';
import { DEFAULT_DELAY } from '@proton/hooks/useStableLoading';

import { ChargebeeIdealButton } from './ChargebeeIdealButton';

jest.mock('./ChargebeeIframe', () => ({
    ChargebeeIframe: () => <div data-testid="chargebee-iframe" />,
}));

function createChargebeeIdeal(overrides: Partial<ChargebeeIdealProcessorHook> = {}) {
    return {
        initializing: false,
        initializationError: false,
        accountHolderNameMissing: false,
        readyToPay: true,
        ...overrides,
    } as ChargebeeIdealProcessorHook;
}

function renderIdealButton(chargebeeIdeal: ChargebeeIdealProcessorHook, props: { formInvalid?: boolean } = {}) {
    const onSubmit = jest.fn((event) => event.preventDefault());

    const { rerender } = render(
        <form onSubmit={onSubmit}>
            <ChargebeeIdealButton chargebeeIdeal={chargebeeIdeal} iframeHandles={{} as any} width="100%" {...props} />
        </form>
    );

    return {
        onSubmit,
        update: (next: ChargebeeIdealProcessorHook) =>
            rerender(
                <form onSubmit={onSubmit}>
                    <ChargebeeIdealButton chargebeeIdeal={next} iframeHandles={{} as any} width="100%" {...props} />
                </form>
            ),
    };
}

const fakeButton = () => screen.getByTestId('fake-ideal-button');
const isBusy = () => fakeButton().getAttribute('aria-busy') === 'true';

describe('ChargebeeIdealButton', () => {
    it('should disable the button when the account holder name is missing', () => {
        renderIdealButton(createChargebeeIdeal({ accountHolderNameMissing: true, readyToPay: false }));

        expect(fakeButton()).toBeDisabled();
        expect(isBusy()).toBe(false);
    });

    it('should show a loading button while the typed name is on its way to the iframe', () => {
        renderIdealButton(createChargebeeIdeal({ readyToPay: false }));

        expect(isBusy()).toBe(true);
    });

    it('should show a loading button while initializing', () => {
        renderIdealButton(createChargebeeIdeal({ initializing: true, readyToPay: false }));

        expect(isBusy()).toBe(true);
    });

    it('should keep loading until well after the name landed, so it cannot blink between keystrokes', () => {
        jest.useFakeTimers();

        const { update } = renderIdealButton(createChargebeeIdeal({ readyToPay: false }));
        expect(isBusy()).toBe(true);

        update(createChargebeeIdeal({ readyToPay: true }));
        expect(isBusy()).toBe(true);

        act(() => jest.advanceTimersByTime(DEFAULT_DELAY));
        expect(screen.queryByTestId('fake-ideal-button')).not.toBeInTheDocument();

        jest.useRealTimers();
    });

    it('should not submit the enclosing form when the enabled fake button is clicked', () => {
        const { onSubmit } = renderIdealButton(createChargebeeIdeal(), { formInvalid: true });

        expect(fakeButton()).not.toBeDisabled();
        fireEvent.click(fakeButton());

        expect(onSubmit).not.toHaveBeenCalled();
    });
});
