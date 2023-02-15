import { EasySwitchFeatureFlag, ImportProvider } from '@proton/activation/interface';

const isEasySwitchMailsEnabled = (provider: ImportProvider, featureMap: EasySwitchFeatureFlag) => {
    if (provider === ImportProvider.GOOGLE) {
        return featureMap.GoogleMail;
    }
    if (provider === ImportProvider.OUTLOOK) {
        return featureMap.OutlookMail;
    }
    return false;
};

const isEasySwitchContactsEnabled = (provider: ImportProvider, featureMap: EasySwitchFeatureFlag) => {
    if (provider === ImportProvider.GOOGLE) {
        return featureMap.GoogleContacts;
    }
    if (provider === ImportProvider.OUTLOOK) {
        return featureMap.OutlookContacts;
    }
    return false;
};

const isEasySwitchCalendarEnabled = (provider: ImportProvider, featureMap: EasySwitchFeatureFlag) => {
    if (provider === ImportProvider.GOOGLE) {
        return featureMap.GoogleCalendar;
    }
    if (provider === ImportProvider.OUTLOOK) {
        return featureMap.OutlookCalendar;
    }
    return false;
};

export const getEnabledFeature = (provider: ImportProvider, featureMap: EasySwitchFeatureFlag) => {
    return {
        isEmailsEnabled: isEasySwitchMailsEnabled(provider, featureMap),
        isContactsEnabled: isEasySwitchContactsEnabled(provider, featureMap),
        isCalendarsEnabled: isEasySwitchCalendarEnabled(provider, featureMap),
    };
};
