import merge from 'lodash/merge';

import { Product } from '@proton/shared/lib/ProductEnum';
import { getAvailableApps } from '@proton/shared/lib/apps/apps';
import { APPS, type APP_NAMES, USER_ROLES } from '@proton/shared/lib/constants';
import {
    type OrganizationExtended,
    type OrganizationSettingsAllowedProduct,
    type User,
    UserType,
} from '@proton/shared/lib/interfaces';
import { allAllowedProducts } from '@proton/shared/lib/organization/accessControl/serialization';

const getDefaultUser = (): User => {
    return {
        Keys: [],
        Flags: {
            sso: false,
        },
    } as unknown as User;
};

const getAdminUser = (): User => {
    return merge(getDefaultUser(), {
        Role: USER_ROLES.ADMIN_ROLE,
    });
};

const getNonPrivateExternalUser = (): User => {
    return merge(getDefaultUser(), {
        Type: UserType.EXTERNAL,
        Private: 0,
        Flags: {
            ['no-proton-address']: true,
        },
    });
};

const getProtonUser = (): User => {
    return merge(getDefaultUser(), {
        Type: UserType.PROTON,
    });
};

const getSSOUser = (): User => {
    return merge(getDefaultUser(), {
        Flags: {
            sso: true,
        },
    });
};

const allApps = new Set([
    APPS.PROTONMAIL,
    APPS.PROTONCALENDAR,
    APPS.PROTONVPN_SETTINGS,
    APPS.PROTONPASS,
    APPS.PROTONDRIVE,
    APPS.PROTONDOCS,
    APPS.PROTONWALLET,
    APPS.PROTONLUMO,
]);

const sort = (a: APP_NAMES[], b: APP_NAMES[] | Set<APP_NAMES>) => {
    return [[...a].sort(), [...b].sort()];
};

const assertEquals = (a1: APP_NAMES[], b1: APP_NAMES[] | Set<APP_NAMES>) => {
    const [a, b] = sort(a1, b1);
    expect(a).toEqual(b);
};

const getAllowedProducts = (products: OrganizationSettingsAllowedProduct[]) => {
    return {
        Settings: {
            AllowedProducts: [...new Set(products)],
        },
    } as OrganizationExtended;
};

const defaultOptions: Parameters<typeof getAvailableApps>[0] = {
    user: getProtonUser(),
    isDocsHomepageAvailable: true,
    context: 'app',
};

describe('available apps', () => {
    describe('proton user', () => {
        it('should filter apps for proton users', () => {
            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                }),
                allApps
            );
        });

        it('should filter apps for proton users in a dropdown context', () => {
            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    context: 'dropdown',
                }),
                allApps
            );
        });

        it('should filter apps for proton users with docs homepage disabled', () => {
            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    isDocsHomepageAvailable: false,
                }),
                allApps
            );
        });

        it('should filter apps for proton users with docs homepage disabled in a dropdown context', () => {
            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    context: 'dropdown',
                    isDocsHomepageAvailable: false,
                }),
                new Set(allApps).difference(new Set([APPS.PROTONDOCS]))
            );
        });

        it('should filter apps for proton users with docs homepage disabled', () => {
            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    isDocsHomepageAvailable: false,
                }),
                allApps
            );
        });

        describe('Allowed products', () => {
            it('should return all apps without any organization', () => {
                assertEquals(
                    getAvailableApps({
                        ...defaultOptions,
                        organization: undefined,
                    }),
                    allApps
                );
            });

            it('should filter apps with only mail allowed', () => {
                assertEquals(
                    getAvailableApps({
                        ...defaultOptions,
                        organization: getAllowedProducts([Product.Mail]),
                    }),
                    [APPS.PROTONMAIL, APPS.PROTONCALENDAR]
                );
            });

            it('should filter apps with only drive allowed', () => {
                assertEquals(
                    getAvailableApps({
                        ...defaultOptions,
                        organization: getAllowedProducts([Product.Drive]),
                    }),
                    [APPS.PROTONDRIVE, APPS.PROTONDOCS]
                );
            });

            it('should filter apps with only drive and mail allowed', () => {
                assertEquals(
                    getAvailableApps({
                        ...defaultOptions,
                        organization: getAllowedProducts([Product.Mail, Product.Drive]),
                    }),
                    [APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE, APPS.PROTONDOCS]
                );
            });

            it('should filter apps with only drive, mail, and vpn allowed', () => {
                assertEquals(
                    getAvailableApps({
                        ...defaultOptions,
                        organization: getAllowedProducts([Product.Mail, Product.VPN, Product.Drive]),
                    }),
                    [APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE, APPS.PROTONDOCS, APPS.PROTONVPN_SETTINGS]
                );
            });

            it('should filter apps with only mail and vpn allowed', () => {
                assertEquals(
                    getAvailableApps({
                        ...defaultOptions,
                        organization: getAllowedProducts([Product.Mail, Product.VPN]),
                    }),
                    [APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONVPN_SETTINGS]
                );
            });

            it('should filter apps with only vpn allowed', () => {
                assertEquals(
                    getAvailableApps({
                        ...defaultOptions,
                        organization: getAllowedProducts([Product.VPN]),
                    }),
                    [APPS.PROTONVPN_SETTINGS]
                );
            });

            it('should filter apps with only drive allowed in a dropdown context', () => {
                assertEquals(
                    getAvailableApps({
                        ...defaultOptions,
                        context: 'dropdown',
                        organization: getAllowedProducts([Product.Drive]),
                    }),
                    [APPS.PROTONDRIVE, APPS.PROTONDOCS]
                );
            });

            it('should filter apps with only drive allowed in a dropdown context without docs', () => {
                assertEquals(
                    getAvailableApps({
                        ...defaultOptions,
                        isDocsHomepageAvailable: false,
                        context: 'dropdown',
                        organization: getAllowedProducts([Product.Drive]),
                    }),
                    [APPS.PROTONDRIVE]
                );
            });

            it('should filter apps with all apps allowed', () => {
                assertEquals(
                    getAvailableApps({
                        ...defaultOptions,
                        organization: getAllowedProducts([...allAllowedProducts]),
                    }),
                    allApps
                );
            });

            it('should filter apps with no apps allowed', () => {
                assertEquals(
                    getAvailableApps({
                        ...defaultOptions,
                        organization: getAllowedProducts([]),
                    }),
                    []
                );
            });
        });
    });

    describe('external users', () => {
        it('should return some apps for external users', () => {
            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    user: getNonPrivateExternalUser(),
                }),
                [
                    APPS.PROTONPASS,
                    APPS.PROTONDRIVE,
                    APPS.PROTONDOCS,
                    APPS.PROTONLUMO,
                    APPS.PROTONWALLET,
                    APPS.PROTONVPN_SETTINGS,
                ]
            );
        });

        it('should return some apps for external users with access control', () => {
            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    user: getNonPrivateExternalUser(),
                    organization: getAllowedProducts([Product.Drive]),
                }),
                [APPS.PROTONDRIVE, APPS.PROTONDOCS]
            );

            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    context: 'dropdown',
                    user: getNonPrivateExternalUser(),
                    organization: getAllowedProducts([Product.Drive]),
                }),
                [APPS.PROTONDRIVE, APPS.PROTONDOCS]
            );

            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    context: 'dropdown',
                    isDocsHomepageAvailable: false,
                    user: getNonPrivateExternalUser(),
                    organization: getAllowedProducts([Product.Drive]),
                }),
                [APPS.PROTONDRIVE]
            );

            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    user: getNonPrivateExternalUser(),
                    organization: getAllowedProducts([Product.Pass]),
                }),
                [APPS.PROTONPASS]
            );

            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    user: getNonPrivateExternalUser(),
                    organization: getAllowedProducts([]),
                }),
                []
            );
        });
    });

    describe('VPN SSO users', () => {
        it('should return some apps for VPN SSO users', () => {
            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    user: getSSOUser(),
                }),
                [APPS.PROTONVPN_SETTINGS]
            );
        });

        it('should return some apps for VPN SSO users with access control', () => {
            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    user: getSSOUser(),
                    organization: getAllowedProducts([Product.VPN]),
                }),
                [APPS.PROTONVPN_SETTINGS]
            );

            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    context: 'dropdown',
                    user: getSSOUser(),
                    organization: getAllowedProducts([Product.VPN]),
                }),
                [APPS.PROTONVPN_SETTINGS]
            );

            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    user: getSSOUser(),
                    organization: getAllowedProducts([Product.Drive]),
                }),
                []
            );

            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    user: getSSOUser(),
                    organization: getAllowedProducts([]),
                }),
                []
            );
        });
    });

    describe('admin users', () => {
        it('should not care about access control', () => {
            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    user: getAdminUser(),
                    organization: getAllowedProducts([]),
                }),
                allApps
            );
        });

        it('should not care about access control, but respect admin role', () => {
            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    user: merge(getAdminUser(), getNonPrivateExternalUser()),
                    organization: getAllowedProducts([]),
                }),
                allApps
            );
        });

        it('should not care about access control, but respect managed user type', () => {
            assertEquals(
                getAvailableApps({
                    ...defaultOptions,
                    user: merge(getAdminUser(), getNonPrivateExternalUser(), { Type: UserType.MANAGED }),
                    organization: getAllowedProducts([]),
                }),
                [
                    APPS.PROTONPASS,
                    APPS.PROTONDRIVE,
                    APPS.PROTONDOCS,
                    APPS.PROTONLUMO,
                    APPS.PROTONWALLET,
                    APPS.PROTONVPN_SETTINGS,
                ]
            );
        });
    });
});
