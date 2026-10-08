import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { EntitlementScope, EntitlementType } from '@proton/payments/core/entitlements/interface';
import { createEntitlementResolverForOrgAndUser } from '@proton/payments/core/entitlements/resolver';
import { makeEntitlements } from '@proton/payments/testing/makeEntitlements';
import {
    APPS,
    CALENDAR_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';

import { getFeatures, getSections } from './helpers';
import type { B2BFeaturesSection } from './interface';

const entitlementsWithGroups = createEntitlementResolverForOrgAndUser(
    undefined,
    makeEntitlements([
        {
            Name: EntitlementName.Groups,
            Quantity: 1,
            Type: EntitlementType.Switch,
            Scope: EntitlementScope.Organization,
        },
    ]),
    []
);
const entitlementsWithoutGroups = createEntitlementResolverForOrgAndUser(undefined, makeEntitlements(), []);

describe('b2b onboarding helpers', () => {
    describe('getFeatures', () => {
        it('should return all features', () => {
            const features = getFeatures(entitlementsWithGroups).filter((f) => f.canShowFeature);
            const featuresIDs = features.map((f) => f.id);

            const expectedFeaturesIDs = [
                'custom-domain',
                'add-users',
                'easy-switch',
                'recovery',
                '2fa',
                'user-groups',
                'security',
                'security-breaches',
                'get-the-apps',
                'imap-smtp',
                'email-forwarding',
                'calendar-sharing',
                'calendar-zoom',
                'share-files',
                'docs',
                'get-drive-app',
                'use-vpn',
                'password-management',
            ];
            expect(features).toHaveLength(18);
            expect(featuresIDs).toEqual(expectedFeaturesIDs);
        });

        it('should return only accessible features', () => {
            const features = getFeatures(entitlementsWithoutGroups).filter((f) => f.canShowFeature);
            const featuresIDs = features.map((f) => f.id);

            const expectedFeaturesIDs = [
                'custom-domain',
                'add-users',
                'easy-switch',
                'recovery',
                '2fa',
                'security',
                'security-breaches',
                'get-the-apps',
                'imap-smtp',
                'email-forwarding',
                'calendar-sharing',
                'calendar-zoom',
                'share-files',
                'docs',
                'get-drive-app',
                'use-vpn',
                'password-management',
            ];
            expect(features).toHaveLength(17);
            expect(featuresIDs).toEqual(expectedFeaturesIDs);
        });
    });

    describe('getSections', () => {
        it('should return mail features', () => {
            const sectionsInMail = getSections(APPS.PROTONMAIL);
            const sectionsInMailSettings = getSections(APPS.PROTONACCOUNT, APPS.PROTONMAIL);

            const expectedSections: B2BFeaturesSection[] = [
                {
                    title: 'Org setup and account security',
                    featuresList: ['easy-switch', 'recovery', '2fa', 'security', 'security-breaches'],
                },
                {
                    title: MAIL_APP_NAME,
                    featuresList: ['get-the-apps', 'imap-smtp', 'user-groups', 'email-forwarding'],
                },
                {
                    title: CALENDAR_APP_NAME,
                    featuresList: ['calendar-sharing', 'calendar-zoom'],
                },
                {
                    title: DRIVE_APP_NAME,
                    featuresList: ['get-drive-app', 'share-files', 'docs'],
                },
                {
                    title: VPN_APP_NAME,
                    featuresList: ['use-vpn'],
                },
                {
                    title: PASS_APP_NAME,
                    featuresList: ['password-management'],
                },
            ];

            expect(sectionsInMail).toEqual(expectedSections);
            expect(sectionsInMailSettings).toEqual(expectedSections);
        });

        it('should return calendar features', () => {
            const sectionsInCalendar = getSections(APPS.PROTONCALENDAR);
            const sectionsInCalendarSettings = getSections(APPS.PROTONACCOUNT, APPS.PROTONCALENDAR);

            const expectedSections: B2BFeaturesSection[] = [
                {
                    title: 'Org setup and account security',
                    featuresList: [
                        'custom-domain',
                        'add-users',
                        'easy-switch',
                        'recovery',
                        '2fa',
                        'security',
                        'security-breaches',
                    ],
                },
                {
                    title: CALENDAR_APP_NAME,
                    featuresList: ['get-the-apps', 'calendar-sharing', 'calendar-zoom'],
                },
                {
                    title: MAIL_APP_NAME,
                    featuresList: ['imap-smtp', 'user-groups', 'email-forwarding'],
                },
                {
                    title: DRIVE_APP_NAME,
                    featuresList: ['get-drive-app', 'share-files', 'docs'],
                },
                {
                    title: VPN_APP_NAME,
                    featuresList: ['use-vpn'],
                },
                {
                    title: PASS_APP_NAME,
                    featuresList: ['password-management'],
                },
            ];

            expect(sectionsInCalendar).toEqual(expectedSections);
            expect(sectionsInCalendarSettings).toEqual(expectedSections);
        });

        it('should return drive features', () => {
            const sectionsInDrive = getSections(APPS.PROTONDRIVE);
            const sectionsInDriveSettings = getSections(APPS.PROTONACCOUNT, APPS.PROTONDRIVE);

            const expectedSections: B2BFeaturesSection[] = [
                {
                    title: 'Org setup and account security',
                    featuresList: [
                        'custom-domain',
                        'add-users',
                        'easy-switch',
                        'recovery',
                        '2fa',
                        'security',
                        'security-breaches',
                    ],
                },
                {
                    title: DRIVE_APP_NAME,
                    featuresList: ['get-drive-app', 'share-files', 'docs'],
                },
                {
                    title: MAIL_APP_NAME,
                    featuresList: ['get-the-apps', 'imap-smtp', 'user-groups', 'email-forwarding'],
                },
                {
                    title: CALENDAR_APP_NAME,
                    featuresList: ['calendar-sharing', 'calendar-zoom'],
                },
                {
                    title: VPN_APP_NAME,
                    featuresList: ['use-vpn'],
                },
                {
                    title: PASS_APP_NAME,
                    featuresList: ['password-management'],
                },
            ];

            expect(sectionsInDrive).toEqual(expectedSections);
            expect(sectionsInDriveSettings).toEqual(expectedSections);
        });
    });
});
