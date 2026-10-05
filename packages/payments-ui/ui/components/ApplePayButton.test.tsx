import { render } from '@testing-library/react';

import type { ApplePayProcessorHook } from '../../payment-processors/useApplePay';
import { ApplePayButton } from './ApplePayButton';

jest.mock('./ChargebeeIframe', () => ({
    ChargebeeIframe: ({ width }: { width?: number | string }) => (
        <div data-testid="chargebee-iframe" data-width={width} />
    ),
}));

function renderApplePayButton({ initializing, width }: { initializing: boolean; width?: number }) {
    const applePay = { initializing } as ApplePayProcessorHook;
    const { container } = render(<ApplePayButton applePay={applePay} iframeHandles={{} as any} width={width} />);

    return {
        buttonContainer: container.firstChild as HTMLElement,
        iframe: container.querySelector('[data-testid="chargebee-iframe"]') as HTMLElement,
    };
}

describe('ApplePayButton', () => {
    it.each([true, false])('should keep the container at the given width when initializing=%s', (initializing) => {
        const { buttonContainer, iframe } = renderApplePayButton({ initializing, width: 150 });

        expect(buttonContainer.style.width).toBe('150px');
        expect(iframe).not.toHaveAttribute('data-width');
    });

    it('should not set a container width when none is given', () => {
        const { buttonContainer } = renderApplePayButton({ initializing: false });

        expect(buttonContainer.style.width).toBe('');
    });
});
