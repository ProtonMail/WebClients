import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Spotlight, useApi } from '@proton/components';
import ProductIcon from '@proton/components/containers/app/ProductIcon';
import { FeatureCode, useFeature } from '@proton/features';
import { getDriveChecklist } from '@proton/shared/lib/api/checklist';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import type { ChecklistApiResponse } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

const FIRST_OF_DECEMBER = new Date(2025, 11, 1).valueOf();

export function DriveSpotlight({ children }: { children: any }) {
    const normalApi = useApi();

    const [user] = useUser();
    const [driveChecklist, setDriveChecklist] = useState<ChecklistApiResponse>();
    const { feature, update } = useFeature(FeatureCode.DriveSpotlightInMail);

    const isEligibleForSpotlight = FIRST_OF_DECEMBER > Date.now() && user.ProductUsedSpace.Drive === 0;
    const canShowSpotlight = isEligibleForSpotlight && !!driveChecklist?.Completed;
    const spotlightAlreadyShown = (feature?.Value ?? false) === false;

    useEffect(() => {
        if (!isEligibleForSpotlight) {
            return;
        }

        const silentApi = getSilentApi(normalApi);

        const effect = async () => {
            const checklist = await silentApi<ChecklistApiResponse>(getDriveChecklist('get-started'));
            setDriveChecklist(checklist);
        };

        void effect();
    }, [isEligibleForSpotlight]);

    return (
        <Spotlight
            content={
                <div className="flex items-center gap-4">
                    <ProductIcon appToLinkTo={APPS.PROTONDRIVE} hideName />
                    <div className="flex-1">
                        {c('Info')
                            .jt`We’ve upgraded your ${DRIVE_APP_NAME} storage to 5GB. Keep your important files and photos encrypted.`}
                    </div>
                </div>
            }
            show={canShowSpotlight && !spotlightAlreadyShown}
            onClose={() => update(false).catch(noop)}
        >
            {children}
        </Spotlight>
    );
}
