import { SecurityCheckupCohort } from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';
import type SecurityState from '@proton/shared/lib/interfaces/securityCheckup/SecurityState';

import getSentinelSecurityCheckupRecommendations from './getSentinelSecurityCheckupRecommendations';

const defaultSecurityState: SecurityState = {
    phrase: {
        isAvailable: true,
        isSet: false,
        isOutdated: false,
    },
    email: {
        value: '',
        isEnabled: false,
        verified: false,
    },
    phone: {
        value: '',
        isEnabled: false,
        verified: false,
    },
    deviceRecovery: {
        isAvailable: true,
        isEnabled: false,
    },
    hasSentinelEnabled: true,
};

const perfectPhrase: Pick<SecurityState, 'phrase'> = {
    phrase: {
        isAvailable: true,
        isSet: true,
        isOutdated: false,
    },
};

const fullEmail: Pick<SecurityState, 'email'> = {
    email: {
        value: 'email@domain.com',
        isEnabled: true,
        verified: true,
    },
};

const perfectSentinelEmail: Pick<SecurityState, 'email'> = {
    email: {
        value: 'email@domain.com',
        isEnabled: false,
        verified: true,
    },
};

const fullPhone: Pick<SecurityState, 'phone'> = {
    phone: {
        value: '123456789',
        isEnabled: true,
        verified: true,
    },
};

const perfectSentinelPhone: Pick<SecurityState, 'phone'> = {
    phone: {
        value: '123456789',
        isEnabled: false,
        verified: true,
    },
};

describe('Phrase set with full email/phone should return sentinel recommendations', () => {
    test('PHRASE | EMAIL | PHONE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectPhrase,
            ...fullEmail,
            ...fullPhone,
        };

        const result = getSentinelSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.Sentinel.SENTINEL_RECOMMENDATIONS,
            actions: ['sentinel-phone', 'sentinel-email'],
            furtherActions: [],
        });
    });

    test('PHRASE | EMAIL', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectPhrase,
            ...fullEmail,
        };

        const result = getSentinelSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.Sentinel.SENTINEL_RECOMMENDATIONS,
            actions: ['sentinel-email'],
            furtherActions: [],
        });
    });

    test('PHRASE | PHONE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectPhrase,
            ...fullPhone,
        };

        const result = getSentinelSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.Sentinel.SENTINEL_RECOMMENDATIONS,
            actions: ['sentinel-phone'],
            furtherActions: [],
        });
    });
});

describe('No phrase set with full email/phone should return complete recovery', () => {
    test('EMAIL | PHONE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...fullEmail,
            ...fullPhone,
        };

        const result = getSentinelSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED,
            actions: ['phrase'],
            furtherActions: [],
        });
    });

    test('EMAIL', () => {
        const securityState = {
            ...defaultSecurityState,

            ...fullEmail,
        };

        const result = getSentinelSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED,
            actions: ['phrase'],
            furtherActions: [],
        });
    });

    test('PHONE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...fullPhone,
        };

        const result = getSentinelSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED,
            actions: ['phrase'],
            furtherActions: [],
        });
    });
});

describe('Non perfect sentinel email state', () => {
    describe('No phrase', () => {
        test('Full email', () => {
            const securityState = {
                ...defaultSecurityState,

                email: {
                    value: 'email@domain.com',
                    isEnabled: true,
                    verified: true,
                },
            };

            const result = getSentinelSecurityCheckupRecommendations(securityState);

            expect(result).toEqual({
                cohort: SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED,
                actions: ['phrase'],
                furtherActions: [],
            });
        });

        test('Enabled but not verified email', () => {
            const securityState = {
                ...defaultSecurityState,

                email: {
                    value: 'email@domain.com',
                    isEnabled: true,
                    verified: false,
                },
            };

            const result = getSentinelSecurityCheckupRecommendations(securityState);

            expect(result).toEqual({
                cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
                actions: ['phrase'],
                furtherActions: ['sentinel-email'],
            });
        });
    });

    describe('With phrase', () => {
        test('Full email', () => {
            const securityState = {
                ...defaultSecurityState,

                ...perfectPhrase,
                email: {
                    value: 'email@domain.com',
                    isEnabled: true,
                    verified: true,
                },
            };

            const result = getSentinelSecurityCheckupRecommendations(securityState);

            expect(result).toEqual({
                cohort: SecurityCheckupCohort.Sentinel.SENTINEL_RECOMMENDATIONS,
                actions: ['sentinel-email'],
                furtherActions: [],
            });
        });

        test('Enabled but not verified email', () => {
            const securityState = {
                ...defaultSecurityState,

                ...perfectPhrase,
                email: {
                    value: 'email@domain.com',
                    isEnabled: true,
                    verified: false,
                },
            };

            const result = getSentinelSecurityCheckupRecommendations(securityState);

            expect(result).toEqual({
                cohort: SecurityCheckupCohort.Sentinel.SENTINEL_RECOMMENDATIONS,
                actions: ['sentinel-email'],
                furtherActions: [],
            });
        });
    });

    describe('Non perfect sentinel phone state', () => {
        describe('No phrase', () => {
            test('Full phone', () => {
                const securityState = {
                    ...defaultSecurityState,

                    phone: {
                        value: '123456789',
                        isEnabled: true,
                        verified: true,
                    },
                };

                const result = getSentinelSecurityCheckupRecommendations(securityState);

                expect(result).toEqual({
                    cohort: SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED,
                    actions: ['phrase'],
                    furtherActions: [],
                });
            });

            test('Enabled but not verified phone', () => {
                const securityState = {
                    ...defaultSecurityState,

                    phone: {
                        value: '123456789',
                        isEnabled: true,
                        verified: false,
                    },
                };

                const result = getSentinelSecurityCheckupRecommendations(securityState);

                expect(result).toEqual({
                    cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
                    actions: ['phrase'],
                    furtherActions: ['sentinel-phone'],
                });
            });
        });

        describe('With phrase', () => {
            test('Full phone', () => {
                const securityState = {
                    ...defaultSecurityState,

                    ...perfectPhrase,
                    phone: {
                        value: '123456789',
                        isEnabled: true,
                        verified: true,
                    },
                };

                const result = getSentinelSecurityCheckupRecommendations(securityState);

                expect(result).toEqual({
                    cohort: SecurityCheckupCohort.Sentinel.SENTINEL_RECOMMENDATIONS,
                    actions: ['sentinel-phone'],
                    furtherActions: [],
                });
            });

            test('Enabled but not verified phone', () => {
                const securityState = {
                    ...defaultSecurityState,

                    ...perfectPhrase,
                    phone: {
                        value: '123456789',
                        isEnabled: true,
                        verified: false,
                    },
                };

                const result = getSentinelSecurityCheckupRecommendations(securityState);

                expect(result).toEqual({
                    cohort: SecurityCheckupCohort.Sentinel.SENTINEL_RECOMMENDATIONS,
                    actions: ['sentinel-phone'],
                    furtherActions: [],
                });
            });
        });
    });
});

test('Perfect sentinel email with phrase', () => {
    const securityState = {
        ...defaultSecurityState,

        ...perfectPhrase,
        ...perfectSentinelEmail,
    };

    const result = getSentinelSecurityCheckupRecommendations(securityState);

    expect(result).toEqual({
        cohort: SecurityCheckupCohort.Common.COMPLETE_RECOVERY,
        actions: [],
        furtherActions: [],
    });
});

test('Perfect sentinel email without phrase', () => {
    const securityState = {
        ...defaultSecurityState,

        ...perfectSentinelEmail,
    };

    const result = getSentinelSecurityCheckupRecommendations(securityState);

    expect(result).toEqual({
        cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
        actions: ['phrase'],
        furtherActions: [],
    });
});

test('Perfect sentinel phone with phrase', () => {
    const securityState = {
        ...defaultSecurityState,

        ...perfectPhrase,
        ...perfectSentinelPhone,
    };

    const result = getSentinelSecurityCheckupRecommendations(securityState);

    expect(result).toEqual({
        cohort: SecurityCheckupCohort.Common.COMPLETE_RECOVERY,
        actions: [],
        furtherActions: ['sentinel-email'],
    });
});

test('Perfect sentinel phone without phrase', () => {
    const securityState = {
        ...defaultSecurityState,

        ...perfectSentinelPhone,
    };

    const result = getSentinelSecurityCheckupRecommendations(securityState);

    expect(result).toEqual({
        cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
        actions: ['phrase'],
        furtherActions: [],
    });
});

test('Recommend setting email if only the phrase is set', () => {
    const securityState = {
        ...defaultSecurityState,

        ...perfectPhrase,
    };

    const result = getSentinelSecurityCheckupRecommendations(securityState);

    expect(result).toEqual({
        cohort: SecurityCheckupCohort.Sentinel.SENTINEL_RECOMMENDATIONS,
        actions: [],
        furtherActions: ['sentinel-email'],
    });
});

describe('No recovery method', () => {
    test('Default state', () => {
        const securityState = {
            ...defaultSecurityState,
        };

        const result = getSentinelSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
            actions: ['phrase'],
            furtherActions: ['sentinel-email'],
        });
    });
});

describe('Availability', () => {
    test('Does not add phrase to action if it is not available', () => {
        const securityState = {
            ...defaultSecurityState,

            phrase: {
                ...defaultSecurityState.phrase,
                isAvailable: false,
            },
        };

        const result = getSentinelSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
            actions: [],
            furtherActions: ['sentinel-email'],
        });
    });
});
