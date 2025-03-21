import { type Dispatch, type SetStateAction, useState } from 'react';

import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import Logo from '@proton/components/components/logo/Logo';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type {
    Api,
    OrganizationSettingsAllowedProduct,
    OrganizationSettingsAllowedProducts,
} from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import getAccessControlApplications from './getAccessControlApplications';
import type { AccessControlApplication } from './types';
import useAllowedProducts from './useAllowedProducts';

const getSerializedProducts = (
    applications: AccessControlApplication[],
    products: Set<OrganizationSettingsAllowedProduct>
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
    void run(update).finally(() => {
        setLoadingMapDiff(id, false);
    });
};

const AccessControl = () => {
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const api = useApi();
    const [loadingMap, setLoadingMap] = useState<{ [key: string]: boolean }>({});

    const applications = getAccessControlApplications();
    const [allowedProducts] = useAllowedProducts();

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
