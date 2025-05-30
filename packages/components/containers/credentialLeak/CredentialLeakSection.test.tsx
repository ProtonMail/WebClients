import { screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { DARK_WEB_MONITORING_ELIGIBILITY_STATE, DARK_WEB_MONITORING_STATE } from '@proton/shared/lib/interfaces';
import { renderWithProviders } from '@proton/testing';
import useFlag from '@proton/unleash/useFlag';

import CredentialLeakSection from './CredentialLeakSection';

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as jest.MockedFunction<any>;

jest.mock('@proton/components/hooks/useNotifications', () => () => ({ createNotification: jest.fn() }));

jest.mock('@proton/hooks/useLoading', () => () => {
    const withLoading = jest.fn().mockImplementation(async (fn) => {
        return fn();
    });
    return [false, withLoading, jest.fn()];
});

const mockApi = jest.fn();
jest.mock('@proton/components/hooks/useApi', () => () => mockApi);

const mockUser = {
    ID: 'user-id',
    isPaid: false,
    hasPassLifetime: false,
} as any;

const mockUserSettings = {
    BreachAlerts: {
        Eligible: DARK_WEB_MONITORING_ELIGIBILITY_STATE.PAID,
        Value: DARK_WEB_MONITORING_STATE.ENABLED,
        EmailNotifications: 0,
    },
    Locale: 'en_US',
} as any;

const paidUser = {
    ...mockUser,
    isPaid: true,
};

const mockBreachesResponse = {
    Breaches: [
        {
            id: 'l8vWAXHBQmv0u7OVtPbcqMa4iwQaBqowINSQjPrxAr-Da8fVPKUkUcqAq30_BCxj1X0nW70HQRmAa-rIvzmKUA==',
            email: 'mailplus@landsteiner.proton.black',
            resolvedState: 2,
            severity: 1,
            name: 'Varias fuentes',
            createdAt: '2022-04-13T00:00:00+00:00',
            publishedAt: '2022-04-13T00:00:00+00:00',
            source: {
                isAggregated: true,
                domain: null,
                category: null,
                country: null,
            },
            size: null,
            exposedData: [
                {
                    code: 'email',
                    name: 'Correo electrónico',
                    values: [],
                },
                {
                    code: 'password',
                    name: 'Contraseña',
                    values: [],
                },
            ],
            passwordLastChars: '**word',
        },
    ],
    Samples: [],
    IsEligible: true,
    Count: 1,
};

const mockSamplesResponse = {
    is_eligible: false,
    count: 5,
    breaches: [],
    samples: [
        {
            id: {
                decrypted: 2,
            },
            name: 'temacessorios.com.br',
            email: 'mailplus@landsteiner.proton.black',
            severity: 0.0,
            created_at: '2022-01-25T00:00:00+00:00',
            source: {
                is_aggregated: false,
                domain: 'temacessorios.com.br',
                category: {
                    code: 'e-commerce',
                    name: 'e-commerce',
                },
                country: {
                    code: 'BR',
                    name: 'Brazil',
                    flag_emoji: '🇧🇷',
                },
            },
            published_at: '2022-01-25T00:00:00+00:00',
            size: 17000,
            exposed_data: [],
            resolved_state: 3,
        },
    ],
};

describe('CredentialLeakSection', () => {
    let user = mockUser;
    let userSettings = mockUserSettings;
    beforeEach(() => {
        jest.clearAllMocks();
        mockApi.mockReset();
    });

    const renderCredentialLeakSection = () => {
        return renderWithProviders(<CredentialLeakSection />, {
            preloadedState: {
                user: getModelState(user),
                userSettings: getModelState(userSettings),
            },
        });
    };

    const setupApiMock = (response: any) => {
        mockApi.mockResolvedValue(response);
    };

    describe('when campaign is not enabled', () => {
        beforeEach(() => {
            mockUseFlag.mockImplementation((flag: string) => flag !== 'DwmTrialFree2025');
        });

        describe('when user is paid', () => {
            beforeEach(() => {
                user = paidUser;
                userSettings = mockUserSettings;
            });

            it('should display breaches', async () => {
                setupApiMock(mockBreachesResponse);
                renderCredentialLeakSection();

                await screen.findByText('Enable Dark Web Monitoring');
                expect(screen.getByText('Information exposed in breach')).toBeInTheDocument();
            });

            it('should display no breaches text when no breaches', async () => {
                setupApiMock({
                    Breaches: [],
                    Samples: [],
                    IsEligible: true,
                    Count: 0,
                });
                renderCredentialLeakSection();

                await screen.findByText('Enable Dark Web Monitoring');
                expect(screen.getByText('No account information was found in any data breaches'));
            });
        });

        describe('when user is free', () => {
            beforeEach(() => {
                user = mockUser;
                userSettings = {
                    ...mockUserSettings,
                    BreachAlerts: {
                        ...mockUserSettings.BreachAlerts,
                        Eligible: DARK_WEB_MONITORING_ELIGIBILITY_STATE.NONPAID,
                        Value: DARK_WEB_MONITORING_STATE.DISABLED,
                    },
                };
            });

            it('should display samples for free users with no campaign eligibility breaches', async () => {
                setupApiMock({
                    Breaches: [],
                    Samples: mockSamplesResponse.samples,
                    IsEligible: false,
                    Count: mockSamplesResponse.count,
                });

                renderCredentialLeakSection();

                await screen.findByText('Enable Dark Web Monitoring');
                expect(screen.getByText(/other potential leak/i)).toBeInTheDocument();
                expect(screen.getByText('Enable Dark Web Monitoring')).toBeInTheDocument();
            });

            it('should when no breaches', async () => {
                setupApiMock({
                    Breaches: [],
                    Samples: [],
                    IsEligible: false,
                    Count: 0,
                });

                renderCredentialLeakSection();

                await screen.findByText('Enable Dark Web Monitoring');
                expect(screen.queryByText(/other potential leak/i)).not.toBeInTheDocument();
                expect(screen.getByText('Enable Dark Web Monitoring')).toBeInTheDocument();
            });
        });
    });
    describe('when campaign is enabled', () => {
        beforeEach(() => {
            mockUseFlag.mockReturnValue(true);
            userSettings = mockUserSettings;
        });

        describe('when user is paid', () => {
            beforeEach(() => {
                user = paidUser;
            });

            it('should display breaches', async () => {
                setupApiMock(mockBreachesResponse);
                renderCredentialLeakSection();

                await screen.findByText('Enable Dark Web Monitoring');
                expect(screen.getByText('Information exposed in breach')).toBeInTheDocument();
            });

            it('should display no breaches text when no breaches', async () => {
                setupApiMock({
                    Breaches: [],
                    Samples: [],
                    IsEligible: true,
                    Count: 0,
                });
                renderCredentialLeakSection();

                await screen.findByText('Enable Dark Web Monitoring');
                expect(screen.getByText('No account information was found in any data breaches'));
            });
        });

        describe('when user is free', () => {
            beforeEach(() => {
                user = mockUser;
                userSettings = {
                    ...mockUserSettings,
                    BreachAlerts: {
                        ...mockUserSettings.BreachAlerts,
                        Eligible: DARK_WEB_MONITORING_ELIGIBILITY_STATE.NONPAID,
                        Value: DARK_WEB_MONITORING_STATE.DISABLED,
                    },
                };
            });

            it('should display breaches during the campaign for free users', async () => {
                setupApiMock(mockBreachesResponse);

                renderCredentialLeakSection();

                await screen.findByText('Upgrade');

                expect(screen.getByText('Information exposed in breach')).toBeInTheDocument();
                expect(screen.getByRole('button', { name: 'Upgrade' })).toBeInTheDocument();

                expect(screen.queryByText('Enable Dark Web Monitoring')).not.toBeInTheDocument();
                expect(screen.queryByText('Enable email notifications')).not.toBeInTheDocument();
            });

            it('should not change if the user has no breaches', async () => {
                setupApiMock({
                    Breaches: [],
                    Samples: [],
                    IsEligible: false,
                    Count: 0,
                });

                renderCredentialLeakSection();

                await screen.findByText('Enable Dark Web Monitoring');
                expect(screen.queryByText(/other potential leak/i)).not.toBeInTheDocument();
                expect(screen.getByText('Enable Dark Web Monitoring')).toBeInTheDocument();
            });
        });
    });
});
