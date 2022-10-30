import { fireEvent, render, screen } from '@testing-library/react';

import { FeatureCode, TopNavbarUpsell } from '@proton/components';
import { UserModel } from '@proton/shared/lib/models';

import { OffersTestProvider, offersCache } from './Offers.test.helpers';
import { OfferConfig } from './interface';

const OFFER_CONTENT = 'deal deal deal deal deal';

const offerConfig: OfferConfig = {
    deals: [],
    featureCode: 'testOffer2022' as FeatureCode,
    layout: () => <div>{OFFER_CONTENT}</div>,
    ID: 'test-offer-2022' as OfferConfig['ID'],
    canBeDisabled: true,
};

const offerConfigAutopopup: OfferConfig = {
    deals: [],
    featureCode: 'testOffer2022' as FeatureCode,
    layout: () => <div>{OFFER_CONTENT}</div>,
    ID: 'test-offer-2022' as OfferConfig['ID'],
    canBeDisabled: true,
    autoPopUp: 'one-time',
};

jest.mock('./hooks/useOfferConfig', function () {
    return {
        __esModule: true,
        default: jest
            .fn()
            .mockReturnValueOnce([undefined, false])
            .mockReturnValueOnce([undefined, false])
            .mockReturnValueOnce([offerConfig, false])
            .mockReturnValueOnce([offerConfig, false])
            .mockReturnValue([offerConfigAutopopup, false]),
    };
});

jest.mock('./hooks/useFetchOffer', function () {
    return {
        __esModule: true,
        default: jest.fn(({ offerConfig }) => [offerConfig, false]),
    };
});

jest.mock('./hooks/useOfferFlags', function () {
    return {
        __esModule: true,
        default: jest.fn(() => ({
            isVisited: false,
            loading: false,
            isActive: true,
            handleVisit: () => {},
            handleHide: () => {},
        })),
    };
});

afterEach(() => {
    offersCache.clear();
});

const TopNavbarComponent = () => (
    <OffersTestProvider>
        <TopNavbarUpsell />
    </OffersTestProvider>
);

describe('Offers', () => {
    describe('Offers display', () => {
        it('Should display upgrade button for free users', () => {
            offersCache.add(UserModel.key, { isFree: true });

            render(<TopNavbarComponent />);

            const link = screen.getByTestId('cta:upgrade-plan');

            expect(link.textContent).toContain('Upgrade');
            expect(link.tagName).toBe('A');
        });

        it('Should display nothing for paid users with offers', () => {
            offersCache.add(UserModel.key, { isFree: false });

            render(<TopNavbarComponent />);

            expect(screen.queryByTestId('cta:upgrade-plan')).toBeNull();
        });

        describe('Non free user with valid offer', () => {
            it('Should display an offer button', () => {
                offersCache.add(UserModel.key, { isFree: false });

                render(<TopNavbarComponent />);

                expect(screen.getByTestId('cta:special-offer')?.textContent).toBe('Special offer');
            });

            it('Should open a modal with offer content', () => {
                offersCache.add(UserModel.key, { isFree: false });

                render(<TopNavbarComponent />);

                const specialOfferCta = screen.getByTestId('cta:special-offer');

                fireEvent.click(specialOfferCta);

                screen.getByText(OFFER_CONTENT);
            });

            it.skip('Should open a modal when autopopup', () => {
                offersCache.add(UserModel.key, { isFree: false });

                render(<TopNavbarComponent />);

                screen.getByText(OFFER_CONTENT);
            });
        });
    });
});
