import { EasySwitchFeatureFlag, ImportProvider } from '@proton/activation/src/interface';
import isTruthy from '@proton/utils/isTruthy';

import { getEnabledFeature } from './OAuthModal.helpers';

describe('OAuthModal helpers', () => {
    it('Should return all feature enabled', () => {
        const featureMap: EasySwitchFeatureFlag = {
            GoogleMail: true,
            GoogleMailSync: true,
            GoogleCalendar: true,
            GoogleContacts: true,
            GoogleDrive: true,
            OutlookMail: true,
            OutlookCalendar: true,
            OutlookContacts: true,
            OtherMail: true,
            OtherCalendar: true,
            OtherContacts: true,
            OtherDrive: true,
        };

        const googleService = getEnabledFeature(ImportProvider.GOOGLE, featureMap);
        expect(Object.values(googleService).every(isTruthy)).toBe(true);
        const outlookService = getEnabledFeature(ImportProvider.OUTLOOK, featureMap);
        expect(Object.values(outlookService).every(isTruthy)).toBe(true);
        const otherService = getEnabledFeature(ImportProvider.DEFAULT, featureMap);
        expect(Object.values(otherService).every(isTruthy)).toBe(false);
    });

    it('Should return true for email and everything else false', () => {
        const featureMap: EasySwitchFeatureFlag = {
            GoogleMail: true,
            GoogleMailSync: true,
            GoogleCalendar: false,
            GoogleContacts: false,
            GoogleDrive: false,
            OutlookMail: true,
            OutlookCalendar: false,
            OutlookContacts: false,
            OtherMail: true,
            OtherCalendar: false,
            OtherContacts: false,
            OtherDrive: false,
        };

        const expected = {
            isEmailsEnabled: true,
            isContactsEnabled: false,
            isCalendarsEnabled: false,
        };

        const googleService = getEnabledFeature(ImportProvider.GOOGLE, featureMap);
        expect(googleService).toStrictEqual(expected);
        const outlookService = getEnabledFeature(ImportProvider.OUTLOOK, featureMap);
        expect(outlookService).toStrictEqual(expected);
        const otherService = getEnabledFeature(ImportProvider.DEFAULT, featureMap);
        expect(Object.values(otherService).every(isTruthy)).toBe(false);
    });

    it('Should return true for calendar and everything else false', () => {
        const featureMap: EasySwitchFeatureFlag = {
            GoogleMail: false,
            GoogleMailSync: false,
            GoogleCalendar: true,
            GoogleContacts: false,
            GoogleDrive: false,
            OutlookMail: false,
            OutlookCalendar: true,
            OutlookContacts: false,
            OtherMail: false,
            OtherCalendar: true,
            OtherContacts: false,
            OtherDrive: false,
        };

        const expected = {
            isEmailsEnabled: false,
            isContactsEnabled: false,
            isCalendarsEnabled: true,
        };

        const googleService = getEnabledFeature(ImportProvider.GOOGLE, featureMap);
        expect(googleService).toStrictEqual(expected);
        const outlookService = getEnabledFeature(ImportProvider.OUTLOOK, featureMap);
        expect(outlookService).toStrictEqual(expected);
        const otherService = getEnabledFeature(ImportProvider.DEFAULT, featureMap);
        expect(Object.values(otherService).every(isTruthy)).toBe(false);
    });

    it('Should return true for contact and everything else false', () => {
        const featureMap: EasySwitchFeatureFlag = {
            GoogleMail: false,
            GoogleMailSync: false,
            GoogleCalendar: false,
            GoogleContacts: true,
            GoogleDrive: false,
            OutlookMail: false,
            OutlookCalendar: false,
            OutlookContacts: true,
            OtherMail: false,
            OtherCalendar: false,
            OtherContacts: false,
            OtherDrive: true,
        };

        const expected = {
            isEmailsEnabled: false,
            isContactsEnabled: true,
            isCalendarsEnabled: false,
        };

        const googleService = getEnabledFeature(ImportProvider.GOOGLE, featureMap);
        expect(googleService).toStrictEqual(expected);
        const outlookService = getEnabledFeature(ImportProvider.OUTLOOK, featureMap);
        expect(outlookService).toStrictEqual(expected);
        const otherService = getEnabledFeature(ImportProvider.DEFAULT, featureMap);
        expect(Object.values(otherService).every(isTruthy)).toBe(false);
    });
});
