import { c } from 'ttag';

import { Spotlight } from '@proton/components';
import ProductIcon from '@proton/components/containers/app/ProductIcon';
import { FeatureCode, useFeature } from '@proton/features';
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useDriveSpotlight } from './useDriveSpotlight';

export function DriveSpotlight({ children }: { children: any }) {
    const canShowSpotlight = useDriveSpotlight();
    const { feature, update } = useFeature(FeatureCode.DriveSpotlightInMail);
    const spotlightAlreadyShown = (feature?.Value ?? false) === false;

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
