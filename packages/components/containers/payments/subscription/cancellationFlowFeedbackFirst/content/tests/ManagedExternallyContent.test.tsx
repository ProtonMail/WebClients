import { fireEvent, render } from '@testing-library/react';

import { SubscriptionPlatform } from '@proton/payments/core/subscription/constants';

import ModalTwo from '../../../../../../components/modalTwo/Modal';
import { ManagedExternallyContent } from '../ManagedExternallyContent';

jest.mock('@proton/atoms/Portal/Portal');

const renderContent = (subscription: any, onClose = () => {}) => {
    return render(
        <ModalTwo open={true} onClose={onClose}>
            <ManagedExternallyContent subscription={subscription} onClose={onClose} />
        </ModalTwo>
    );
};

describe('ManagedExternallyContent', () => {
    it('should render the Google Play title and text for an Android subscription', () => {
        const { container } = renderContent({ External: SubscriptionPlatform.Android });

        expect(container).toHaveTextContent('Manage your subscription on Google Play');
        expect(container).toHaveTextContent('Google Play Store');
        expect(container).not.toHaveTextContent('Apple App Store');
    });

    it('should render the Apple App Store title and text for an iOS subscription', () => {
        const { container } = renderContent({ External: SubscriptionPlatform.iOS });

        expect(container).toHaveTextContent('Manage your subscription on Apple App Store');
        expect(container).toHaveTextContent('Apple App Store');
        expect(container).not.toHaveTextContent('Google Play');
    });

    it('should call onClose when the "Got it" button is pressed', () => {
        const onClose = jest.fn();
        const { getByTestId } = renderContent({ External: SubscriptionPlatform.Android }, onClose);

        fireEvent.click(getByTestId('ManagedExternallyContent/onClose'));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
