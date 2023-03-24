import { screen } from '@testing-library/react';

import { removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import range from '@proton/utils/range';

import { render } from '../../helpers/test/render';
import MailUpsellBanner from './MailUpsellBanner';

const props = {
    columnMode: true,
    needToShowUpsellBanner: { current: true },
};

describe('Mail upsell banner', () => {
    afterAll(() => {
        removeItem('WelcomePaneEncounteredMessages');
    });

    it('should display a banner', async () => {
        await render(<MailUpsellBanner {...props} />);

        screen.getByTestId('promotion-banner');
    });

    it('should display the expected banner', async () => {
        // Fake localStorage so that we can predict which banner will be displayed
        // Added more ids in the array (1 to 100) in case we add more banners in the future
        // Here we expect to see the banner with the id "0"
        setItem('WelcomePaneEncounteredMessages', JSON.stringify(range(1, 100)));

        await render(<MailUpsellBanner {...props} />);

        screen.getByText('Get more storage and premium features.');
    });
});
