import { type ChangeEventHandler, type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { useSamlSSO } from '@proton/account/samlSSO/hooks';
import { Tooltip } from '@proton/atoms';
import Logo from '@proton/components/components/logo/Logo';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { Product } from '@proton/shared/lib/ProductEnum';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import { appSupportsSSO } from '@proton/shared/lib/apps/apps';
import {
    APPS,
    BRAND_NAME,
    CALENDAR_APP_NAME,
    CONTACTS_APP_NAME,
    DOCS_APP_NAME,
    DRIVE_APP_NAME,
    LUMO_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
    WALLET_APP_NAME,
} from '@proton/shared/lib/constants';
import type { OrganizationSettingsAllowedProduct } from '@proton/shared/lib/interfaces';
import { serializeAllowedProducts } from '@proton/shared/lib/organization/accessControl/serialization';

import MailCalendarIcon from './MailCalendarIcon';
import useAllowedProducts from './useAllowedProducts';

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

const AccessControlItem = ({
    title,
    description,
    logo,
    targetProducts,
    showSSOBadge = false,
}: {
    title: string;
    description: string;
    logo: ReactNode;
    targetProducts: OrganizationSettingsAllowedProduct[];
    showSSOBadge?: boolean;
}) => {
    const [loading, setLoading] = useState(false);

    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const api = useApi();

    const [allowedProducts] = useAllowedProducts();

    const previousSerialisedProducts = serializeAllowedProducts(allowedProducts);
    const isChecked = targetProducts.every((product) => allowedProducts.has(product));
    const updatedProducts = getUpdatedProducts({ allowedProducts, targetProducts, isChecked: !isChecked });
    const serialisedProducts = serializeAllowedProducts(updatedProducts);
    const atLeastOneApplicationLimit = !serialisedProducts.length;

    const handleChange: ChangeEventHandler<HTMLInputElement> = async () => {
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

    const NoSSOBadge = () => {
        return (
            <Tooltip title={c('Info').t`This service is not available to users signing in with single sign-on.`}>
                <span className="inline-block rounded-sm text-semibold bg-strong color-weak text-sm px-1 py-0.5">{c(
                    'Info'
                ).t`No single sign-on`}</span>
            </Tooltip>
        );
    };

    return (
        <div className="flex flex-nowrap pb-2 gap-2 border-bottom border-weak">
            <div className="shrink-0">{logo}</div>
            <div className="flex-1 flex flex-column">
                <div className="flex flex-nowrap items-start gap-1 w-full">
                    <div className="flex flex-1 gap-1">
                        <span className="block text-ellipsis text-bold">{title}</span>
                        {showSSOBadge && <NoSSOBadge />}
                    </div>
                    {atLeastOneApplicationLimit && isChecked ? (
                        <Tooltip title={c('Info').t`At least one application must be active`} openDelay={0}>
                            <span className="inline-flex">
                                <Toggle id={targetProducts.join(':')} disabled={true} checked={true} />
                            </span>
                        </Tooltip>
                    ) : (
                        <Toggle
                            id={targetProducts.join(':')}
                            loading={loading}
                            checked={isChecked}
                            onChange={async (e) => {
                                setLoading(true);
                                await handleChange(e);
                                setLoading(false);
                            }}
                        />
                    )}
                </div>
                <div className="color-weak">{description}</div>
            </div>
        </div>
    );
};

const AccessControlSettingsSection = () => {
    const [samlSSO] = useSamlSSO();
    const hasSsoConfig = samlSSO && samlSSO.configs.length > 0;

    return (
        <SettingsSectionWide>
            <SettingsParagraph className="mb-4">
                {c('Info')
                    .t`Manage which ${BRAND_NAME} applications the members of your organization can access. If disabled, only administrators will have access.`}
            </SettingsParagraph>
            <div className="flex flex-column gap-2 max-w-custom" style={{ '--max-w-custom': '640px' }}>
                <AccessControlItem
                    title={
                        // translator: Proton Mail and Proton Calendar
                        c('Info').t`${MAIL_APP_NAME} and ${CALENDAR_APP_NAME}`
                    }
                    description={c('Info').t`Email and calendar, integrated with ${CONTACTS_APP_NAME}`}
                    logo={<MailCalendarIcon size={8} />}
                    targetProducts={[Product.Mail, Product.Calendar]}
                    showSSOBadge={!appSupportsSSO(APPS.PROTONMAIL) && hasSsoConfig}
                />

                <AccessControlItem
                    title={DRIVE_APP_NAME}
                    description={c('Info').t`Cloud storage, integrated with ${DOCS_APP_NAME}`}
                    logo={<Logo appName={APPS.PROTONDRIVE} variant="glyph-only" size={8} />}
                    targetProducts={[Product.Drive]}
                    showSSOBadge={!appSupportsSSO(APPS.PROTONDRIVE) && hasSsoConfig}
                />

                <AccessControlItem
                    title={VPN_APP_NAME}
                    description={c('Info').t`VPN with dedicated servers and IP addresses`}
                    logo={<Logo appName={APPS.PROTONVPN_SETTINGS} variant="glyph-only" size={8} />}
                    targetProducts={[Product.VPN]}
                    showSSOBadge={!appSupportsSSO(APPS.PROTONVPN_SETTINGS) && hasSsoConfig}
                />

                <AccessControlItem
                    title={PASS_APP_NAME}
                    description={c('Info').t`Password manager with extra account security`}
                    logo={<Logo appName={APPS.PROTONPASS} variant="glyph-only" size={8} />}
                    targetProducts={[Product.Pass]}
                    showSSOBadge={!appSupportsSSO(APPS.PROTONPASS) && hasSsoConfig}
                />

                <AccessControlItem
                    title={WALLET_APP_NAME}
                    description={c('Info').t`Self-custodial crypto wallet`}
                    logo={<Logo appName={APPS.PROTONWALLET} variant="glyph-only" size={8} />}
                    targetProducts={[Product.Wallet]}
                    showSSOBadge={!appSupportsSSO(APPS.PROTONWALLET) && hasSsoConfig}
                />

                <AccessControlItem
                    title={LUMO_APP_NAME}
                    description=""
                    logo={<Logo appName={APPS.PROTONLUMO} variant="glyph-only" size={8} />}
                    targetProducts={[Product.Lumo]}
                    showSSOBadge={!appSupportsSSO(APPS.PROTONLUMO) && hasSsoConfig}
                />
            </div>
        </SettingsSectionWide>
    );
};
export default AccessControlSettingsSection;
