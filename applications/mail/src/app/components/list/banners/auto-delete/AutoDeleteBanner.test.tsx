import { render, screen } from '@testing-library/react';

import AutoDeleteBanner from './AutoDeleteBanner';

jest.mock('@proton/components/hooks/useApi', () => () => jest.fn());
jest.mock('@proton/redux-shared-store/sharedProvider', () => ({
    useDispatch: () => jest.fn(),
}));

describe('AutoDeleteBanner', () => {
    describe('when bannerType is paid', () => {
        it('should render correct banner', () => {
            render(<AutoDeleteBanner bannerType="paid-banner" />);
            expect(
                screen.getByText(
                    /Automatically delete messages that have been in trash and spam for more than 30 days./i
                )
            ).toBeInTheDocument();
        });
    });

    describe('when bannerType is free', () => {
        it('should render correct banner', () => {
            render(<AutoDeleteBanner bannerType="free-banner" />);
            expect(
                screen.getByText(
                    /Upgrade to automatically delete messages that have been in Trash or Spam for more than 30 days./i
                )
            ).toBeInTheDocument();
        });
    });

    describe('when bannerType is enabled', () => {
        it('should render correct banner', () => {
            render(<AutoDeleteBanner bannerType="enabled" />);
            expect(
                screen.getByText(
                    /Messages that have been in trash and spam more than 30 days will be automatically deleted./i
                )
            ).toBeInTheDocument();
        });
    });
});
