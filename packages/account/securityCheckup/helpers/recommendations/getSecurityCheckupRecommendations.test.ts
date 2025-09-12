import { SecurityCheckupCohort } from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';
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
    hasSentinelEnabled: false,
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
            cohort: SecurityCheckupCohort.Common.COMPLETE_RECOVERY,
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
            cohort: SecurityCheckupCohort.Common.COMPLETE_RECOVERY,
            actions: [],
            furtherActions: ['set-phone'],
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
            cohort: SecurityCheckupCohort.Common.COMPLETE_RECOVERY,
            actions: [],
            furtherActions: ['set-email'],
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
            cohort: SecurityCheckupCohort.Default.COMPLETE_RECOVERY_SINGLE,
            actions: ['set-email', 'set-phone'],
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
            cohort: SecurityCheckupCohort.Default.COMPLETE_RECOVERY_SINGLE,
            actions: ['device'],
            furtherActions: ['set-phone'],
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
            cohort: SecurityCheckupCohort.Default.COMPLETE_RECOVERY_SINGLE,
            actions: ['device'],
            furtherActions: ['set-email'],
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
            cohort: SecurityCheckupCohort.Default.COMPLETE_RECOVERY_SINGLE,
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
            cohort: SecurityCheckupCohort.Default.COMPLETE_RECOVERY_SINGLE,
            actions: ['phrase'],
            furtherActions: ['set-phone'],
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
            cohort: SecurityCheckupCohort.Default.COMPLETE_RECOVERY_SINGLE,
            actions: ['phrase'],
            furtherActions: ['set-email'],
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
            cohort: SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED,
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
            cohort: SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED,
            actions: ['device'],
            furtherActions: ['phrase', 'set-phone'],
        });
    });

    test('PHONE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectPhone,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED,
            actions: ['device'],
            furtherActions: ['phrase', 'set-email'],
        });
    });
});

describe('No recovery method', () => {
    test('Default state', () => {
        const result = getSecurityCheckupRecommendations(defaultSecurityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
            actions: ['phrase'],
            furtherActions: ['set-email', 'set-phone'],
        });
    });

    test('DEVICE', () => {
        const securityState = {
            ...defaultSecurityState,

            ...perfectDeviceRecovery,
        };

        const result = getSecurityCheckupRecommendations(securityState);

        expect(result).toEqual({
            cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
            actions: ['phrase'],
            furtherActions: ['set-email', 'set-phone'],
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
                cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
                actions: ['set-email', 'phrase'],
                furtherActions: ['set-phone'],
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
                cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
                actions: ['set-email', 'phrase'],
                furtherActions: ['set-phone'],
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
                cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
                actions: ['set-phone', 'phrase'],
                furtherActions: ['set-email'],
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
                cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
                actions: ['set-phone', 'phrase'],
                furtherActions: ['set-email'],
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
            cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
            actions: [],
            furtherActions: ['set-email', 'set-phone'],
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
            cohort: SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED,
            actions: [],
            furtherActions: ['phrase'],
        });
    });
});
