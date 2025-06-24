import { act, fireEvent, render } from '@testing-library/react';

import { SubscriptionPlatform } from '@proton/payments';

import InAppPurchaseModal from './InAppPurchaseModal';

jest.mock('@proton/components/components/portal/Portal');

it('should render', () => {
    const { container } = render(
        <InAppPurchaseModal
            open={true}
            subscription={{ External: SubscriptionPlatform.Android } as any}
            onClose={() => {}}
        />
    );

    expect(container).not.toBeEmptyDOMElement();
});

it('should trigger onClose when user presses the button', async () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
        <InAppPurchaseModal
            onClose={onClose}
            open={true}
            subscription={{ External: SubscriptionPlatform.Android } as any}
        />
    );

    await act(async () => {
        fireEvent.click(getByTestId('InAppPurchaseModal/onClose'));
    });

    expect(onClose).toHaveBeenCalled();
});

it('should render iOS text if subscription is managed by Apple', async () => {
    const { container } = render(
        <InAppPurchaseModal
            onClose={() => {}}
            open={true}
            subscription={{ External: SubscriptionPlatform.iOS } as any}
        />
    );

    expect(container).toHaveTextContent('Apple App Store');
    expect(container).not.toHaveTextContent('Google');
    expect(container).not.toHaveTextContent('Google Play');
});

it('should immediately close if subscription is not managed externally', () => {
    const onClose = jest.fn();
    const { container } = render(
        <InAppPurchaseModal
            onClose={onClose}
            open={true}
            subscription={{ External: SubscriptionPlatform.Default } as any}
        />
    );

    expect(onClose).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
});
