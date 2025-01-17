import { c } from 'ttag';

import { userSettingsThunk } from '@proton/account';
import { ButtonLike, Href } from '@proton/atoms';
import AppLink from '@proton/components/components/link/AppLink';
import { APPS, DOCS_APP_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_ANDROID_URL, DRIVE_DOWNLOAD_URL, DRIVE_IOS_URL } from '@proton/shared/lib/drive/constants';
import { isDriveUser } from '@proton/shared/lib/helpers/usedClientsFlags';
import driveAppBackground from '@proton/styles/assets/img/onboarding/feature_tour-drive-background.svg';
import logoDrive from '@proton/styles/assets/img/onboarding/feature_tour-logo-drive.svg';

import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';

export const shouldDisplayProtonDriveTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [userSettings] = await Promise.all([dispatch(userSettingsThunk())]);
    return !isDriveUser(BigInt(userSettings.UsedClientFlags));
};

const ProtonDriveTourStep = (props: FeatureTourStepProps) => {
    const ios = (
        <Href key="iosButton" href={DRIVE_IOS_URL} target="_blank">
            iOS
        </Href>
    );
    const android = (
        <Href key="androidButton" href={DRIVE_ANDROID_URL} target="_blank">
            Android
        </Href>
    );
    const desktop = (
        <Href key="desktopButton" href={DRIVE_DOWNLOAD_URL} target="_blank">{c('Onboarding modal').t`Desktop`}</Href>
    );
    const description = c('Info')
        .jt`Sync and manage files with the ${DRIVE_APP_NAME} app. Create and share documents in ${DOCS_APP_NAME}, and securely store them. All on ${ios}, ${android} and ${desktop}.`;

    return (
        <FeatureTourStepsContent
            title={<img src={logoDrive} alt={DRIVE_APP_NAME} />}
            description={description}
            illustration={driveAppBackground}
            illustrationSize="full"
            titleClassName="pt-3"
            descriptionClassName="mb-8"
            primaryButton={
                <ButtonLike
                    as={AppLink}
                    className="mb-2"
                    to="/"
                    color="norm"
                    fullWidth
                    toApp={APPS.PROTONDRIVE}
                    target="_blank"
                >{c('Action').t`Go to ${DRIVE_APP_NAME}`}</ButtonLike>
            }
            {...props}
        />
    );
};

export default ProtonDriveTourStep;
