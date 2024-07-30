import SecurityCheckupCohort from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';
import type SecurityState from '@proton/shared/lib/interfaces/securityCheckup/SecurityState';

import getSecurityCheckupRecommendations from './getSecurityCheckupRecommendations';

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
};

const perfectPhrase: Pick<SecurityState, 'phrase'> = {
    phrase: {
        isAvailable: true,
        isSet: true,
        isOutdated: false,
    },
};

const perfectEmail: Pick<SecurityState, 'email'> = {
    email: {
        value: 'email@domain.com',
        isEnabled: true,
        verified: true,
    },
};

const perfectPhone: Pick<SecurityState, 'phone'> = {
    phone: {
        value: '123456789',
        isEnabled: true,
        verified: true,
    },
};

const perfectDeviceRecovery: Pick<SecurityState, 'deviceRecovery'> = {
    deviceRecovery: {
        isAvailable: true,
        isEnabled: true,
    },
};

describe('Multi recovery', () => {
    test('PHRASE | EMAIL | PHONE | DEVICE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectPhrase,
            ...perfectEmail,
            ...perfectPhone,
            ...perfectDeviceRecovery,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.COMPLETE_RECOVERY_MULTIPLE,
            actions: [],
            furtherActions: [],
        });
    });

    test('PHRASE | EMAIL | DEVICE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectPhrase,
            ...perfectEmail,
            ...perfectDeviceRecovery,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.COMPLETE_RECOVERY_MULTIPLE,
            actions: [],
            furtherActions: ['phone'],
        });
    });

    test('PHRASE | PHONE | DEVICE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectPhrase,
            ...perfectPhone,
            ...perfectDeviceRecovery,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.COMPLETE_RECOVERY_MULTIPLE,
            actions: [],
            furtherActions: ['email'],
        });
    });
});

describe('Single recovery', () => {
    test('PHRASE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectPhrase,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.COMPLETE_RECOVERY_SINGLE,
            actions: ['email', 'phone'],
            furtherActions: [],
        });
    });

    test('PHRASE | EMAIL', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectPhrase,
            ...perfectEmail,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.COMPLETE_RECOVERY_SINGLE,
            actions: ['device'],
            furtherActions: ['phone'],
        });
    });

    test('PHRASE | PHONE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectPhrase,
            ...perfectPhone,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.COMPLETE_RECOVERY_SINGLE,
            actions: ['device'],
            furtherActions: ['email'],
        });
    });

    test('PHRASE | EMAIL | PHONE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectPhrase,
            ...perfectEmail,
            ...perfectPhone,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.COMPLETE_RECOVERY_SINGLE,
            actions: ['device'],
            furtherActions: [],
        });
    });

    test('EMAIL | DEVICE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectEmail,
            ...perfectDeviceRecovery,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.COMPLETE_RECOVERY_SINGLE,
            actions: ['phrase'],
            furtherActions: ['phone'],
        });
    });

    test('PHONE | DEVICE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectPhone,
            ...perfectDeviceRecovery,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.COMPLETE_RECOVERY_SINGLE,
            actions: ['phrase'],
            furtherActions: ['email'],
        });
    });
});

describe('Account recovery', () => {
    test('EMAIL | PHONE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectEmail,
            ...perfectPhone,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.ACCOUNT_RECOVERY_ENABLED,
            actions: ['device'],
            furtherActions: ['phrase'],
        });
    });

    test('EMAIL', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectEmail,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.ACCOUNT_RECOVERY_ENABLED,
            actions: ['device'],
            furtherActions: ['phrase', 'phone'],
        });
    });

    test('PHONE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectPhone,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.ACCOUNT_RECOVERY_ENABLED,
            actions: ['device'],
            furtherActions: ['phrase', 'email'],
        });
    });
});

describe('No recovery method', () => {
    test('Default state', () => {
        const result = getSecurityCheckupRecommendations(defaultSecurityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.NO_RECOVERY_METHOD,
            actions: ['phrase'],
            furtherActions: ['email', 'phone'],
        });
    });

    test('DEVICE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectDeviceRecovery,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.NO_RECOVERY_METHOD,
            actions: ['phrase'],
            furtherActions: ['email', 'phone'],
        });
    });

    describe('Almost perfect email state', () => {
        test('Enabled but not verified email', () => {
            const securityState = {
                ...defaultSecurityState,

                email: {
                    value: 'email@domain.com',
                    isEnabled: true,
                    verified: false,
                },
            };

            const result = getSecurityCheckupRecommendations(securityState);

            expect(result).toEqual({
                cohort: SecurityCheckupCohort.NO_RECOVERY_METHOD,
                actions: ['email'],
                furtherActions: ['phrase'],
            });
        });

        test('Verified but not enabled email', () => {
            const securityState = {
                ...defaultSecurityState,

                email: {
                    value: 'email@domain.com',
                    isEnabled: false,
                    verified: true,
                },
            };

            const result = getSecurityCheckupRecommendations(securityState);

            expect(result).toEqual({
                cohort: SecurityCheckupCohort.NO_RECOVERY_METHOD,
                actions: ['email'],
                furtherActions: ['phrase'],
            });
        });
    });

    describe('Almost perfect phone state', () => {
        test('Enabled but not verified phone', () => {
            const securityState = {
                ...defaultSecurityState,

                phone: {
                    value: '123456789',
                    isEnabled: true,
                    verified: false,
                },
            };

            const result = getSecurityCheckupRecommendations(securityState);

            expect(result).toEqual({
                cohort: SecurityCheckupCohort.NO_RECOVERY_METHOD,
                actions: ['phone'],
                furtherActions: ['phrase'],
            });
        });

        test('Verified but not enabled phone', () => {
            const securityState = {
                ...defaultSecurityState,

                phone: {
                    value: '123456789',
                    isEnabled: false,
                    verified: true,
                },
            };

            const result = getSecurityCheckupRecommendations(securityState);

            expect(result).toEqual({
                cohort: SecurityCheckupCohort.NO_RECOVERY_METHOD,
                actions: ['phone'],
                furtherActions: ['phrase'],
            });
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

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.NO_RECOVERY_METHOD,
            actions: [],
            furtherActions: ['email', 'phone'],
        });
    });

    test('Does not add device to action if it is not available', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectEmail,
            ...perfectPhone,
            deviceRecovery: {
                ...defaultSecurityState.deviceRecovery,
                isAvailable: false,
            },
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.ACCOUNT_RECOVERY_ENABLED,
            actions: [],
            furtherActions: ['phrase'],
        });
    });
});
