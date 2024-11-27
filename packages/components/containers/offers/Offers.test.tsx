import { fireEvent, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import TopNavbarUpsell from '@proton/components/components/topnavbar/TopNavbarUpsell';
import type { FeatureCode } from '@proton/features';
import { APPS } from '@proton/shared/lib/constants';
import { setBit } from '@proton/shared/lib/helpers/bitset';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';
import type { UserModel, UserSettings } from '@proton/shared/lib/interfaces';

import { renderWithProviders } from '../contacts/tests/render';
import { OffersTestProvider } from './Offers.test.helpers';
import type { OfferConfig } from './interface';

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

const TopNavbarComponent = () => (
    <OffersTestProvider>
        <TopNavbarUpsell app={APPS.PROTONMAIL} />
    </OffersTestProvider>
);

const getUserSettings = ({ offersEnabled }: { offersEnabled: boolean }): UserSettings => {
    return {
        News: offersEnabled ? setBit(0, NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS) : 0,
    } as UserSettings;
};

const getUser = ({ isFree }: { isFree: boolean }) => {
    return {
        isFree,
    } as UserModel;
};

describe('Offers', () => {
    describe('Offers display', () => {
        it('Should display upgrade button for free users', () => {
            renderWithProviders(<TopNavbarComponent />, {
                preloadedState: {
                    user: getModelState(getUser({ isFree: true })),
                    userSettings: getModelState(getUserSettings({ offersEnabled: true })),
                },
            });

            const link = screen.getByTestId('cta:upgrade-plan');

            expect(link.textContent).toContain('Upgrade');
        });

        it('Should display nothing for paid users with offers', () => {
            renderWithProviders(<TopNavbarComponent />, {
                preloadedState: {
                    user: getModelState(getUser({ isFree: false })),
                    userSettings: getModelState(getUserSettings({ offersEnabled: true })),
                },
            });

            expect(screen.queryByTestId('cta:upgrade-plan')).toBeNull();
        });

        describe('Non free user with valid offer', () => {
            it('Should not display an offer button with setting turned off', () => {
                renderWithProviders(<TopNavbarComponent />, {
                    preloadedState: {
                        user: getModelState(getUser({ isFree: false })),
                        userSettings: getModelState(getUserSettings({ offersEnabled: false })),
                    },
                });

                expect(screen.queryByTestId('cta:special-offer')).toBeNull();
            });

            it('Should display an offer button', () => {
                renderWithProviders(<TopNavbarComponent />, {
                    preloadedState: {
                        user: getModelState(getUser({ isFree: false })),
                        userSettings: getModelState(getUserSettings({ offersEnabled: true })),
                    },
                });

                expect(screen.getByTestId('cta:special-offer')?.textContent).toBe('Special offer');
            });

            it('Should open a modal with offer content', () => {
                renderWithProviders(<TopNavbarComponent />, {
                    preloadedState: {
                        user: getModelState(getUser({ isFree: false })),
                        userSettings: getModelState(getUserSettings({ offersEnabled: true })),
                    },
                });

                const specialOfferCta = screen.getByTestId('cta:special-offer');

                fireEvent.click(specialOfferCta);

                screen.getByText(OFFER_CONTENT);
            });

            it.skip('Should open a modal when autopopup', () => {
                renderWithProviders(<TopNavbarComponent />, {
                    preloadedState: {
                        user: getModelState(getUser({ isFree: false })),
                        userSettings: getModelState(getUserSettings({ offersEnabled: true })),
                    },
                });

                screen.getByText(OFFER_CONTENT);
            });
        });
    });
});
