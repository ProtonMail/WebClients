import {
    getOrganization as getOrganizationConfig,
    getOrganizationSettings as getOrganizationSettingsConfig,
} from '@proton/shared/lib/api/organization';
import type { Api, Organization, OrganizationSettings, OrganizationWithSettings } from '@proton/shared/lib/interfaces';

export const getOrganization = ({ api }: { api: Api }) => {
    return api<{
        Organization: Organization;
    }>(getOrganizationConfig()).then(({ Organization }) => Organization);
};

export const getDefaultOrganizationSettings = (): OrganizationSettings => {
    return {
        ShowName: false,
        LogoID: null,
        ShowScribeWritingAssistant: true,
        VideoConferencingEnabled: false,
        AllowedProducts: ['All'],
    };
};

export const getOrganizationSettings = ({ api }: { api: Api }) => {
    const defaultSettings = getDefaultOrganizationSettings();
    return api<OrganizationSettings>(getOrganizationSettingsConfig())
        .then((value) => ({
            ...defaultSettings,
            ...value,
        }))
        .catch(() => {
            return defaultSettings;
        });
};

export const getOrganizationWithSettings = async ({
    api,
    defaultSettings,
}: {
    api: Api;
    defaultSettings?: boolean; // Avoid fetching organization settings in case this is true (most likely it is missing required scopes)
}): Promise<OrganizationWithSettings> => {
    const [Organization, OrganizationSettings] = await Promise.all([
        getOrganization({ api }),
        defaultSettings ? getDefaultOrganizationSettings() : getOrganizationSettings({ api }),
    ]);

    return {
        ...Organization,
        Settings: OrganizationSettings,
    };
};
