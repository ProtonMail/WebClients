import type { ComponentProps } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';

import { IDEAL_WERO_BRAND_NAME } from '@proton/chargebee/lib/constants';
import { DEFAULT_DELAY } from '@proton/hooks/useStableLoading';

import type { ChargebeeIdealProcessorHook } from '../../react-extensions/useChargebeeIdeal';
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
        setButtonLabel: jest.fn(),
        ...overrides,
    } as ChargebeeIdealProcessorHook;
}

function renderIdealButton(
    chargebeeIdeal: ChargebeeIdealProcessorHook,
    props: Partial<ComponentProps<typeof ChargebeeIdealButton>> = {}
) {
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

    it('should not show a spinner while the typed name is on its way to the iframe', () => {
        renderIdealButton(createChargebeeIdeal({ readyToPay: false }));

        expect(fakeButton()).not.toBeDisabled();
        expect(isBusy()).toBe(false);
    });

    it('should show a loading button while initializing', () => {
        renderIdealButton(createChargebeeIdeal({ initializing: true, readyToPay: false }));

        expect(isBusy()).toBe(true);
    });

    it('should swap back to the real button as soon as the name landed', () => {
        const { update } = renderIdealButton(createChargebeeIdeal({ readyToPay: false }));

        update(createChargebeeIdeal({ readyToPay: true }));

        expect(screen.queryByTestId('fake-ideal-button')).not.toBeInTheDocument();
    });

    it('should keep the initialization spinner up long enough not to blink', () => {
        jest.useFakeTimers();

        const { update } = renderIdealButton(createChargebeeIdeal({ initializing: true, readyToPay: false }));
        expect(isBusy()).toBe(true);

        update(createChargebeeIdeal({ initializing: false, readyToPay: true }));
        expect(isBusy()).toBe(true);

        act(() => jest.advanceTimersByTime(DEFAULT_DELAY));
        expect(screen.queryByTestId('fake-ideal-button')).not.toBeInTheDocument();

        jest.useRealTimers();
    });

    it('should forward a click on the fake button while the name is syncing', () => {
        const onClick = jest.fn();
        renderIdealButton(createChargebeeIdeal({ readyToPay: false }), { onClick });

        fireEvent.click(fakeButton());

        expect(onClick).toHaveBeenCalledWith({ source: 'fake-button', type: 'ideal' });
    });

    it('should not submit the enclosing form when the enabled fake button is clicked', () => {
        const { onSubmit } = renderIdealButton(createChargebeeIdeal(), { formInvalid: true });

        expect(fakeButton()).not.toBeDisabled();
        fireEvent.click(fakeButton());

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should show the caller CTA and hand the same label to the iframe', () => {
        const chargebeeIdeal = createChargebeeIdeal({ readyToPay: false });
        renderIdealButton(chargebeeIdeal, { children: 'Pay €9.99 now' });

        expect(fakeButton()).toHaveTextContent('Pay €9.99 now');
        expect(chargebeeIdeal.setButtonLabel).toHaveBeenCalledWith('Pay €9.99 now');
    });

    it('should fall back to the brand label when the CTA is not a plain string', () => {
        const chargebeeIdeal = createChargebeeIdeal({ readyToPay: false });
        renderIdealButton(chargebeeIdeal, { children: <span>Donate</span> });

        expect(fakeButton()).toHaveTextContent(`Pay with ${IDEAL_WERO_BRAND_NAME}`);
        expect(chargebeeIdeal.setButtonLabel).toHaveBeenCalledWith(`Pay with ${IDEAL_WERO_BRAND_NAME}`);
    });
});
