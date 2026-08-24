import { useContext } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { goToPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import { getSpace } from '@proton/shared/lib/user/storage';

import DriveLogo from '../../../../../../components/logo/DriveLogo';
import { getDocumentEditor, getStorageFeature, getVersionHistory } from '../../../../../payments/features/drive';
import { AlsoInYourPlanSectionContext } from '../AlsoInYourPlanSection';
import AlsoInYourPlanSectionCard from '../AlsoInYourPlanSectionCard';
import drive from '../illustrations/drive.jpg';

const AlsoInYourPlanProtonDrive = () => {
    const planSectionContext = useContext(AlsoInYourPlanSectionContext);
    const [user] = useUser();

    const space = getSpace(user);
    if (!planSectionContext) {
        return null;
    }

    const { app, freePlan, plan, isBundlePlan } = planSectionContext;
    const maxDriveSpace = humanSize({ bytes: space.maxDriveSpace, unit: 'GB', fraction: 0 });

    const cardConfig = {
        app: APPS.PROTONDRIVE,
        copy: () => c('Dashboard').t`Keep your files, photos, and documents safe with ${maxDriveSpace} cloud storage.`,
        image: drive,
        buttonCopy: () => goToPlanOrAppNameText(DRIVE_APP_NAME),
        logo: <DriveLogo />,
        features: [
            getStorageFeature(space.maxSpace, {
                freePlan,
                family: plan?.Name === PLANS.FAMILY,
                duo: plan?.Name === PLANS.DUO,
                visionary: plan?.Name === PLANS.VISIONARY,
            }),
            getDocumentEditor(),
            getVersionHistory(),
        ],
    };

    return <AlsoInYourPlanSectionCard app={app} config={cardConfig} shouldDisplayAllFeatures={isBundlePlan} />;
};

export default AlsoInYourPlanProtonDrive;
