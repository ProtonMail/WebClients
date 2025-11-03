import { useEffect, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/components';
import { getDriveChecklist } from '@proton/shared/lib/api/checklist';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { ChecklistApiResponse } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

const FIRST_OF_DECEMBER = new Date(2025, 11, 1).valueOf();

export function useDriveSpotlight(): boolean {
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);

    const [user] = useUser();
    const [driveChecklist, setDriveChecklist] = useState<ChecklistApiResponse>();

    useEffect(() => {
        silentApi<ChecklistApiResponse>({ ...getDriveChecklist('get-started'), silence: true })
            .then(setDriveChecklist)
            .catch(noop);
    }, [silentApi]);

    return FIRST_OF_DECEMBER > Date.now() && user.ProductUsedSpace.Drive === 0 && !!driveChecklist?.Completed;
}
