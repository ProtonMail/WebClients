import { useEffect, useState } from 'react';

import { getOrganizationImporter } from '@proton/activation/src/api';
import type { ApiImporterOrganization } from '@proton/activation/src/api/api.interface';
import { useApi } from '@proton/components';

export const useImporterOrganization = (): [ApiImporterOrganization | undefined, boolean] => {
    const api = useApi();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ApiImporterOrganization>();

    useEffect(() => {
        void (async () => {
            try {
                const result = await api<{ ImporterOrganizations: ApiImporterOrganization[] }>({
                    ...getOrganizationImporter(),
                    silence: true,
                });

                setData(result.ImporterOrganizations[0]);
            } catch {}

            setLoading(false);
        })();
    }, []);

    return [data, loading];
};
