import { render } from '@testing-library/react';

import type { GooglePayProcessorHook } from '../../payment-processors/useGooglePay';
import { GooglePayButton } from './GooglePayButton';

jest.mock('./ChargebeeIframe', () => ({
    ChargebeeIframe: ({ width }: { width?: number | string }) => (
        <div data-testid="chargebee-iframe" data-width={width} />
    ),
}));

function renderGooglePayButton({ initializing, width }: { initializing: boolean; width?: number }) {
    const googlePay = { initializing } as GooglePayProcessorHook;
    const { container } = render(<GooglePayButton googlePay={googlePay} iframeHandles={{} as any} width={width} />);

    return {
        buttonContainer: container.firstChild as HTMLElement,
        iframe: container.querySelector('[data-testid="chargebee-iframe"]') as HTMLElement,
    };
}

describe('GooglePayButton', () => {
    it.each([true, false])('should keep the container at the given width when initializing=%s', (initializing) => {
        const { buttonContainer, iframe } = renderGooglePayButton({ initializing, width: 150 });

        expect(buttonContainer.style.width).toBe('150px');
        expect(iframe).not.toHaveAttribute('data-width');
    });

    it('should not set a container width when none is given', () => {
        const { buttonContainer } = renderGooglePayButton({ initializing: false });

        expect(buttonContainer.style.width).toBe('');
    });
});
