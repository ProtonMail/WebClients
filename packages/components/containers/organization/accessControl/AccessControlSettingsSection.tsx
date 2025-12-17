import type { ReactNode } from 'react';

import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSamlSSO } from '@proton/account/samlSSO/hooks';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Logo from '@proton/components/components/logo/Logo';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoadingByKey } from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { Product } from '@proton/shared/lib/ProductEnum';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import { appSupportsSSO } from '@proton/shared/lib/apps/apps';
import {
    APPS,
    AUTHENTICATOR_APP_NAME,
    BRAND_NAME,
    CALENDAR_APP_NAME,
    CONTACTS_APP_NAME,
    DOCS_APP_NAME,
    DRIVE_APP_NAME,
    LUMO_APP_NAME,
    MAIL_APP_NAME,
    MEET_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
    WALLET_APP_NAME,
} from '@proton/shared/lib/constants';
import { hasMailProduct } from '@proton/shared/lib/helpers/organization';
import type { OrganizationSettingsAllowedProduct } from '@proton/shared/lib/interfaces';
import {
    deserializeAllowedProducts,
    serializeAllowedProducts,
} from '@proton/shared/lib/organization/accessControl/serialization';
import useFlag from '@proton/unleash/useFlag';

import SettingsSection from '../../account/SettingsSection';
import MailCalendarIcon from './MailCalendarIcon';

const getUpdatedProducts = ({
    allowedProducts,
    targetProducts,
    isChecked,
}: {
    allowedProducts: Set<OrganizationSettingsAllowedProduct>;
    targetProducts: OrganizationSettingsAllowedProduct[];
    isChecked: boolean;
}) => {
    const allowedProductsSet = new Set(allowedProducts);

    targetProducts.forEach((product) => {
        if (isChecked) {
            allowedProductsSet.add(product);
        } else {
            allowedProductsSet.delete(product);
        }
    });

    return allowedProductsSet;
};

const NoSSOBadge = () => {
    return (
        <Tooltip title={c('Info').t`This service is not available to users signing in with single sign-on.`}>
            <span className="inline-block rounded-sm text-semibold bg-strong color-weak text-sm px-1 py-0.5">{c('Info')
                .t`No single sign-on`}</span>
        </Tooltip>
    );
};

interface AccessControlItem {
    title: string;
    description: string;
    logo: ReactNode;
    targetProducts: OrganizationSettingsAllowedProduct[];
    showSSOBadge?: boolean;
    available?: boolean;
}
interface EnhancedAccessControlItem {
    item: AccessControlItem;
    meta: {
        isChecked: boolean;
        id: string;
    };
}
const AccessControlSettingsSection = () => {
    const [samlSSO] = useSamlSSO();
    const hasSsoConfig = samlSSO && samlSSO.configs.length > 0;
    const [organization] = useOrganization();

    const isAuthenticatorAvailable = useFlag('AuthenticatorSettingsEnabled');
    const isMeetAvailable = useFlag('PMVC2025');

    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const api = useApi();
    const [loadingMap, withLoadingByKey] = useLoadingByKey();

    const handleChange = async (
        serialisedProducts: ReturnType<typeof serializeAllowedProducts>,
        previousSerialisedProducts: ReturnType<typeof serializeAllowedProducts>
    ) => {
        try {
            dispatch(
                organizationActions.updateOrganizationSettings({ value: { AllowedProducts: serialisedProducts } })
            );
            await api(updateOrganizationSettings({ AllowedProducts: serialisedProducts }));
            createNotification({ text: c('Info').t`Preference saved` });
        } catch (error) {
            // Revert change on 403 cancellation
            dispatch(
                organizationActions.updateOrganizationSettings({
                    value: { AllowedProducts: previousSerialisedProducts },
                })
            );
        }
    };

    const accessControlItems: AccessControlItem[] = [
        {
            // So I feel this is a hacky way, but can't suggest a better solution right now. Case: subusers of
            // Lumo B2B, VPN B2B, Pass B2B, Drive B2B don't have access to Mail. However without this conditions
            // admins would still see the toggle to enable/disable Mail for their subusers. We need a way to
            // check if _subusers_ of certain org have access to certain products, not just Mail. Perhaps the
            // proper way already exists. The best idea that I had is using Organization.PlanFlags, but I'm not
            // confident enough to use the same condition for the other toggles.
            available: hasMailProduct(organization),
            title: c('Info').t`${MAIL_APP_NAME} and ${CALENDAR_APP_NAME}`,
            description: c('Info').t`Email and calendar, integrated with ${CONTACTS_APP_NAME}`,
            logo: <MailCalendarIcon size={8} />,
            targetProducts: [Product.Mail, Product.Calendar],
            showSSOBadge: !appSupportsSSO(APPS.PROTONMAIL) && hasSsoConfig,
        },
        {
            title: DRIVE_APP_NAME,
            description: c('Info').t`Cloud storage, integrated with ${DOCS_APP_NAME}`,
            logo: <Logo appName={APPS.PROTONDRIVE} variant="glyph-only" size={8} />,
            targetProducts: [Product.Drive],
            showSSOBadge: !appSupportsSSO(APPS.PROTONDRIVE) && hasSsoConfig,
        },
        {
            title: VPN_APP_NAME,
            description: c('Info').t`VPN with dedicated servers and IP addresses`,
            logo: <Logo appName={APPS.PROTONVPN_SETTINGS} variant="glyph-only" size={8} />,
            targetProducts: [Product.VPN],
            showSSOBadge: !appSupportsSSO(APPS.PROTONVPN_SETTINGS) && hasSsoConfig,
        },
        {
            title: PASS_APP_NAME,
            description: c('Info').t`Password manager with extra account security`,
            logo: <Logo appName={APPS.PROTONPASS} variant="glyph-only" size={8} />,
            targetProducts: [Product.Pass],
            showSSOBadge: !appSupportsSSO(APPS.PROTONPASS) && hasSsoConfig,
        },
        {
            available: isAuthenticatorAvailable,
            title: AUTHENTICATOR_APP_NAME,
            description: c('Info').t`Two-factor authentication`,
            logo: <Logo appName={APPS.PROTONAUTHENTICATOR} variant="glyph-only" size={8} />,
            targetProducts: [Product.Authenticator],
            showSSOBadge: !appSupportsSSO(APPS.PROTONAUTHENTICATOR) && hasSsoConfig,
        },
        {
            title: LUMO_APP_NAME,
            description: c('Info').t`Private AI assistant`,
            logo: <Logo appName={APPS.PROTONLUMO} variant="glyph-only" size={8} />,
            targetProducts: [Product.Lumo],
            showSSOBadge: !appSupportsSSO(APPS.PROTONLUMO) && hasSsoConfig,
        },
        {
            title: WALLET_APP_NAME,
            description: c('Info').t`Self-custodial crypto wallet`,
            logo: <Logo appName={APPS.PROTONWALLET} variant="glyph-only" size={8} />,
            targetProducts: [Product.Wallet],
            showSSOBadge: !appSupportsSSO(APPS.PROTONWALLET) && hasSsoConfig,
        },
        {
            available: isMeetAvailable,
            title: MEET_APP_NAME,
            description: c('Info').t`Secure, end-to-end encrypted video conferencing`,
            logo: <Logo appName={APPS.PROTONMEET} variant="glyph-only" size={8} />,
            targetProducts: [Product.Meet],
            showSSOBadge: !appSupportsSSO(APPS.PROTONMEET) && hasSsoConfig,
        },
    ];

    const allowedProducts = deserializeAllowedProducts(organization?.Settings?.AllowedProducts);
    const previousSerialisedProducts = serializeAllowedProducts(allowedProducts);

    const enhancedAccessControlItems = accessControlItems
        .filter((value) => value.available !== false)
        .map((item): EnhancedAccessControlItem => {
            return {
                item,
                meta: {
                    id: item.targetProducts.join(','),
                    isChecked: item.targetProducts.every((product) => allowedProducts.has(product)),
                },
            };
        });

    const checkedItems = enhancedAccessControlItems.reduce<number>((acc, item) => acc + Number(item.meta.isChecked), 0);
    const atLeastOneApplicationLimit = checkedItems === 1;

    return (
        <SettingsSectionWide>
            <SettingsParagraph className="mb-4">
                {c('Info')
                    .t`Manage which ${BRAND_NAME} applications the members of your organization can access. If disabled, only administrators will have access.`}
            </SettingsParagraph>
            <SettingsSection className="flex flex-column gap-2">
                {enhancedAccessControlItems.map((enhancedAccessControlItem) => {
                    const {
                        item,
                        meta: { id, isChecked },
                    } = enhancedAccessControlItem;
                    return (
                        <label key={id} htmlFor={id} className="flex flex-nowrap pb-2 gap-2 border-bottom border-weak">
                            <div className="shrink-0">{item.logo}</div>
                            <div className="flex-1 flex flex-column">
                                <div className="flex flex-nowrap items-start gap-1 w-full">
                                    <div className="flex flex-1 gap-1">
                                        <span className="block text-ellipsis text-bold">{item.title}</span>
                                        {item.showSSOBadge && <NoSSOBadge />}
                                    </div>
                                    {atLeastOneApplicationLimit && isChecked ? (
                                        <Tooltip
                                            title={c('Info').t`At least one application must be active`}
                                            openDelay={0}
                                        >
                                            <span className="inline-flex">
                                                <Toggle id={id} disabled={true} checked={true} />
                                            </span>
                                        </Tooltip>
                                    ) : (
                                        <Toggle
                                            id={id}
                                            loading={loadingMap[id]}
                                            checked={isChecked}
                                            onChange={() => {
                                                void withLoadingByKey(
                                                    id,
                                                    handleChange(
                                                        serializeAllowedProducts(
                                                            getUpdatedProducts({
                                                                allowedProducts,
                                                                targetProducts: item.targetProducts,
                                                                isChecked: !isChecked,
                                                            })
                                                        ),
                                                        previousSerialisedProducts
                                                    )
                                                );
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="color-weak">{item.description}</div>
                            </div>
                        </label>
                    );
                })}
            </SettingsSection>
        </SettingsSectionWide>
    );
};
export default AccessControlSettingsSection;
