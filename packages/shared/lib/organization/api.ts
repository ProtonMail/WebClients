import {
    getOrganization as getOrganizationConfig,
    getOrganizationSettings as getOrganizationSettingsConfig,
} from '../api/organization';
import { INVOICE_EMAIL_STATE } from '../constants';
import type { Api } from '../interfaces/Api';
import type { Organization, OrganizationSettings } from '../interfaces/Organization';

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
        MailCategoryViewEnabled: false,
        SSOBackupPasswordDisabled: false,
        PasswordReminderEnforced: false,
        LumoApiEnabled: false,
        AllowedProducts: ['All'],
        InvoiceEmail: null,
        InvoiceEmailState: INVOICE_EMAIL_STATE.DISABLED,
        PasswordPolicies: [],
        LogAuth: 0,
        HighSecurity: 0,
        OrganizationPolicy: {
            Enforced: 0,
        },
    };
};

export const getOrganizationSettings = ({ api }: { api: Api }): Promise<OrganizationSettings> => {
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
