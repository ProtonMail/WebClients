import { api } from '@proton/pass/lib/api/api';
import { type MaybeNull } from '@proton/pass/types';
import type { OrganizationSettings, OrganizationSettingsResponse } from '@proton/pass/types/data/organization';
import { logger } from '@proton/pass/utils/logger';

export const getOrganizationSettings = async (): Promise<MaybeNull<OrganizationSettingsResponse>> => {
    try {
        logger.info(`[Organization] Syncing organization settings`);
        return (await api<{ Organization: OrganizationSettingsResponse }>({ url: 'pass/v1/organization' }))
            .Organization;
    } catch (error) {
        return null;
    }
};

export const setOrganizationSettings = async ({ shareMode }: Partial<OrganizationSettings>) =>
    api({
        url: 'pass/v1/organization/settings',
        method: 'put',
        data: { ShareMode: shareMode },
    });
