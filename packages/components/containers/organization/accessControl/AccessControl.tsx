import { type Dispatch, type SetStateAction, useState } from 'react';

import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { useOrganization } from '@proton/account/organization/hooks';
import Logo from '@proton/components/components/logo/Logo';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { Product } from '@proton/shared/lib/ProductEnum';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import {
    APPS,
    type APP_NAMES,
    BRAND_NAME,
    CALENDAR_APP_NAME,
    DOCS_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
    WALLET_APP_NAME,
} from '@proton/shared/lib/constants';
import type {
    Api,
    OrganizationSettingsAllowedProduct,
    OrganizationSettingsAllowedProducts,
} from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

interface Application {
    title: string;
    appName: APP_NAMES;
    description: string;
    product: OrganizationSettingsAllowedProduct;
}

const CONTACTS_APP_NAME = `${BRAND_NAME} Contacts`;

const getApplications = (): Application[] => {
    return [
        {
            title: MAIL_APP_NAME,
            description: c('Info').t`Email service, integrated with ${CALENDAR_APP_NAME} and ${CONTACTS_APP_NAME}`,
            appName: APPS.PROTONMAIL,
            product: Product.Mail,
        },
        {
            title: CALENDAR_APP_NAME,
            description: c('Info').t`Calendar, integrated with ${MAIL_APP_NAME} and ${CONTACTS_APP_NAME}`,
            appName: APPS.PROTONCALENDAR,
            product: Product.Calendar,
        },
        {
            title: DRIVE_APP_NAME,
            description: c('Info').t`Cloud storage, integrated with ${DOCS_APP_NAME}`,
            appName: APPS.PROTONDRIVE,
            product: Product.Drive,
        },
        {
            title: VPN_APP_NAME,
            description: c('Info').t`VPN with dedicated servers and IP addresses`,
            appName: APPS.PROTONVPN_SETTINGS,
            product: Product.VPN,
        },
        {
            title: PASS_APP_NAME,
            description: c('Info').t`Password manager with extra account security`,
            appName: APPS.PROTONPASS,
            product: Product.Pass,
        },
        {
            title: WALLET_APP_NAME,
            description: c('Info').t`Self-custodial crypto wallet`,
            appName: APPS.PROTONWALLET,
            product: Product.Wallet,
        },
    ];
};

const getAllowedProductsSet = (
    applications: ReturnType<typeof getApplications>,
    allowedProducts: OrganizationSettingsAllowedProducts = ['All']
): Set<OrganizationSettingsAllowedProduct> => {
    const value = new Set(allowedProducts);
    if (value.has('All')) {
        return new Set(applications.map((application) => application.product));
    }
    return value;
};

const getSerializedProducts = (
    applications: ReturnType<typeof getApplications>,
    products: ReturnType<typeof getAllowedProductsSet>
): OrganizationSettingsAllowedProducts => {
    if (applications.some((application) => !products.has(application.product))) {
        return [...products.values()];
    }
    return ['All'];
};

const handleChange = async (
    id: OrganizationSettingsAllowedProduct,
    update: OrganizationSettingsAllowedProducts,
    context: {
        api: Api;
        dispatch: ReturnType<typeof useDispatch>;
        createNotification: ReturnType<typeof useNotifications>['createNotification'];
        setLoadingMap: Dispatch<SetStateAction<{ [key: string]: boolean }>>;
    }
) => {
    const run = async (AllowedProducts: OrganizationSettingsAllowedProducts) => {
        context.dispatch(organizationActions.updateOrganizationSettings({ value: { AllowedProducts } }));
        await context.api(updateOrganizationSettings({ AllowedProducts }));
        context.createNotification({ text: c('Info').t`Preference saved` });
    };

    const setLoadingMapDiff = (id: OrganizationSettingsAllowedProduct, value: boolean) => {
        context.setLoadingMap((oldValue) => ({
            ...oldValue,
            [id]: value,
        }));
    };

    setLoadingMapDiff(id, true);
    run(update).finally(() => {
        setLoadingMapDiff(id, false);
    });
};

const AccessControl = () => {
    const [organization] = useOrganization();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const api = useApi();
    const [loadingMap, setLoadingMap] = useState<{ [key: string]: boolean }>({});

    const applications = getApplications();
    const allowedProducts = getAllowedProductsSet(applications, organization?.Settings?.AllowedProducts);

    const getUpdatedProducts = (id: OrganizationSettingsAllowedProduct, value: boolean) => {
        const updatedSet = new Set(allowedProducts);
        if (value) {
            updatedSet.add(id);
        } else {
            updatedSet.delete(id);
        }
        return getSerializedProducts(applications, updatedSet);
    };

    return (
        <SettingsSectionWide>
            <SettingsParagraph className="mb-4">
                {c('Info')
                    .t`Manage which ${BRAND_NAME} applications the members of your organization can access. If disabled, only administrators will have access.`}
            </SettingsParagraph>
            <div className="flex flex-column gap-2">
                {applications.map((application) => (
                    <div key={application.product} className="flex flex-nowrap pb-2 gap-2 border-bottom border-weak">
                        <div className="shrink-0">
                            <Logo appName={application.appName} variant="glyph-only" size={8} />
                        </div>
                        <div className="flex-1 flex flex-column">
                            <div className="flex">
                                <div className="flex-1 text-ellipsis text-bold ">{application.title}</div>
                                <Toggle
                                    id={application.product}
                                    loading={loadingMap[application.product]}
                                    checked={allowedProducts.has(application.product)}
                                    onChange={(event) => {
                                        const updatedSet = getUpdatedProducts(
                                            application.product,
                                            event.target.checked
                                        );
                                        handleChange(application.product, updatedSet, {
                                            api,
                                            dispatch,
                                            createNotification,
                                            setLoadingMap,
                                        }).catch(noop);
                                    }}
                                />
                            </div>
                            <div className="color-weak">{application.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        </SettingsSectionWide>
    );
};
export default AccessControl;
