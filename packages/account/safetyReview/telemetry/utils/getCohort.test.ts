import { SafetyReviewCohort, getCohort } from './getCohort';

const noMethods = {
    email: { isEnabled: false, hasValue: false },
    phone: { isEnabled: false, hasValue: false },
    deviceRecovery: { isAvailable: true, isEnabled: false },
    phrase: { isAvailable: true, isSet: false },
    recoveryContactsData: { isAvailable: true, isEnabled: false },
    emergencyContactsData: { isAvailable: true, isEnabled: false },
};

const perfectPhrase = {
    isAvailable: true,
    isSet: true,
};

const perfectEmail = {
    isEnabled: true,
    hasValue: true,
};

const perfectPhone = {
    isEnabled: true,
    hasValue: true,
};

const perfectDeviceRecovery = {
    isAvailable: true,
    isEnabled: true,
};

const perfectRecoveryContacts = {
    isAvailable: true,
    isEnabled: true,
};

const perfectEmergencyContacts = {
    isAvailable: true,
    isEnabled: true,
};

describe('getCohort', () => {
    describe('NO_RECOVERY_METHOD', () => {
        it('when no methods are set', () => {
            const cohort = getCohort(noMethods);

            expect(cohort).toBe(SafetyReviewCohort.NO_RECOVERY_METHOD);
        });

        it('when email is present but not enabled', () => {
            const cohort = getCohort({ ...noMethods, email: { isEnabled: false, hasValue: true } });

            expect(cohort).toBe(SafetyReviewCohort.NO_RECOVERY_METHOD);
        });

        it('when phone is present but not enabled', () => {
            const cohort = getCohort({ ...noMethods, phone: { isEnabled: false, hasValue: true } });

            expect(cohort).toBe(SafetyReviewCohort.NO_RECOVERY_METHOD);
        });

        it('when phrase is available but not set', () => {
            const cohort = getCohort({ ...noMethods, phrase: { isAvailable: true, isSet: false } });

            expect(cohort).toBe(SafetyReviewCohort.NO_RECOVERY_METHOD);
        });

        it('device recovery alone does not qualify for any cohort', () => {
            const cohort = getCohort({ ...noMethods, deviceRecovery: perfectDeviceRecovery });

            expect(cohort).toBe(SafetyReviewCohort.NO_RECOVERY_METHOD);
        });

        it('recovery contacts alone does not qualify for any cohort', () => {
            const cohort = getCohort({ ...noMethods, recoveryContactsData: perfectRecoveryContacts });

            expect(cohort).toBe(SafetyReviewCohort.NO_RECOVERY_METHOD);
        });
    });

    describe('COMPLETE_RECOVERY', () => {
        it('phrase, email, and device', () => {
            const cohort = getCohort({
                ...noMethods,
                phrase: perfectPhrase,
                email: perfectEmail,
                deviceRecovery: perfectDeviceRecovery,
            });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY);
        });

        it('phrase, phone, and device', () => {
            const cohort = getCohort({
                ...noMethods,
                phrase: perfectPhrase,
                phone: perfectPhone,
                deviceRecovery: perfectDeviceRecovery,
            });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY);
        });

        it('phrase, email, and recovery contacts', () => {
            const cohort = getCohort({
                ...noMethods,
                phrase: perfectPhrase,
                email: perfectEmail,
                recoveryContactsData: perfectRecoveryContacts,
            });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY);
        });

        it('phrase, phone, and recovery contacts', () => {
            const cohort = getCohort({
                ...noMethods,
                phrase: perfectPhrase,
                phone: perfectPhone,
                recoveryContactsData: perfectRecoveryContacts,
            });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY);
        });

        it('emergency contacts and phrase', () => {
            const cohort = getCohort({
                ...noMethods,
                emergencyContactsData: perfectEmergencyContacts,
                phrase: perfectPhrase,
            });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY);
        });

        it('emergency contacts, email, and device', () => {
            const cohort = getCohort({
                ...noMethods,
                emergencyContactsData: perfectEmergencyContacts,
                email: perfectEmail,
                deviceRecovery: perfectDeviceRecovery,
            });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY);
        });

        it('emergency contacts, email, and recovery contacts', () => {
            const cohort = getCohort({
                ...noMethods,
                emergencyContactsData: perfectEmergencyContacts,
                email: perfectEmail,
                recoveryContactsData: perfectRecoveryContacts,
            });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY);
        });

        it('emergency contacts, phone, and device', () => {
            const cohort = getCohort({
                ...noMethods,
                emergencyContactsData: perfectEmergencyContacts,
                phone: perfectPhone,
                deviceRecovery: perfectDeviceRecovery,
            });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY);
        });

        it('emergency contacts, phone, and recovery contacts', () => {
            const cohort = getCohort({
                ...noMethods,
                emergencyContactsData: perfectEmergencyContacts,
                phone: perfectPhone,
                recoveryContactsData: perfectRecoveryContacts,
            });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY);
        });
    });

    describe('COMPLETE_RECOVERY_SINGLE', () => {
        it('phrase', () => {
            const cohort = getCohort({
                ...noMethods,
                phrase: {
                    isAvailable: true,
                    isSet: true,
                },
            });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE);
        });

        it('phrase and email', () => {
            const cohort = getCohort({ ...noMethods, phrase: perfectPhrase, email: perfectEmail });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE);
        });

        it('phrase and phone', () => {
            const cohort = getCohort({ ...noMethods, phrase: perfectPhrase, phone: perfectPhone });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE);
        });

        it('when email and device', () => {
            const cohort = getCohort({ ...noMethods, email: perfectEmail, deviceRecovery: perfectDeviceRecovery });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE);
        });

        it('when phone and device', () => {
            const cohort = getCohort({ ...noMethods, phone: perfectPhone, deviceRecovery: perfectDeviceRecovery });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE);
        });

        it('when email and recovery contacts', () => {
            const cohort = getCohort({
                ...noMethods,
                email: perfectEmail,
                recoveryContactsData: perfectRecoveryContacts,
            });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE);
        });

        it('when phone and recovery contacts', () => {
            const cohort = getCohort({
                ...noMethods,
                phone: perfectPhone,
                recoveryContactsData: perfectRecoveryContacts,
            });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE);
        });

        it('when emergency contacts', () => {
            const cohort = getCohort({ ...noMethods, emergencyContactsData: perfectEmergencyContacts });

            expect(cohort).toBe(SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE);
        });
    });

    describe('ACCOUNT_RECOVERY_ENABLED', () => {
        it('email', () => {
            const cohort = getCohort({
                ...noMethods,
                email: {
                    isEnabled: true,
                    hasValue: true,
                },
            });

            expect(cohort).toBe(SafetyReviewCohort.ACCOUNT_RECOVERY_ENABLED);
        });

        it('phone', () => {
            const cohort = getCohort({
                ...noMethods,
                phone: perfectPhone,
            });

            expect(cohort).toBe(SafetyReviewCohort.ACCOUNT_RECOVERY_ENABLED);
        });
    });
});
