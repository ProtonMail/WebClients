import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';

export default createOxlintConfig({
    ignorePatterns: [
        'testing/mockMatchMedia.ts',
        'testing/mockUseAddressKeys.ts',
        'testing/mockUseAddresses.ts',
        'testing/mockUseOrganization.ts',
        'testing/mockUseSubscription.ts',
        'testing/mockUseUser.ts',
        'testing/mockUseUserKeys.ts',
        'testing/mockUseUserSettings.ts',
    ],
    restrictedImports: {
        // @proton/components and the account domain UI packages depend on this package.
        patterns: [
            {
                group: [
                    '@proton/components',
                    '@proton/components/*',
                    '@proton/account-recovery',
                    '@proton/account-recovery/*',
                    '@proton/account-security',
                    '@proton/account-security/*',
                    '@proton/byoe',
                    '@proton/byoe/*',
                    '@proton/delegated-access',
                    '@proton/delegated-access/*',
                    '@proton/safety-review',
                    '@proton/safety-review/*',
                ],
                message:
                    'Keep @proton/account free of UI that imports @proton/components; put it in its domain package instead.',
            },
        ],
    },
});
