import { c } from 'ttag';

import { userSettingsThunk } from '@proton/account';
import { ButtonLike, Href } from '@proton/atoms';
import AppLink from '@proton/components/components/link/AppLink';
import { APPS, DOCS_APP_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_ANDROID_URL, DRIVE_DOWNLOAD_URL, DRIVE_IOS_URL } from '@proton/shared/lib/drive/constants';
import { isDriveUser } from '@proton/shared/lib/helpers/usedClientsFlags';
import { goToPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import driveAppBackground from '@proton/styles/assets/img/onboarding/feature_tour-drive-background.svg';
import logoDrive from '@proton/styles/assets/img/onboarding/feature_tour-logo-drive.svg';

import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepCTA from './components/FeatureTourStepCTA';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';

export const shouldDisplayProtonDriveTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [userSettings] = await Promise.all([dispatch(userSettingsThunk())]);
    return {
        canDisplay: !isDriveUser(BigInt(userSettings.UsedClientFlags)),
        preloadUrls: [logoDrive, driveAppBackground],
    };
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

    // translator: complete sentence: Sync and manage files with the Proton Drive app. Create and share documents in Proton Docs, and securely store them. All on iOS, Android and Desktop.
    const description = c('Info')
        .jt`Sync and manage files with the ${DRIVE_APP_NAME} app. Create and share documents in ${DOCS_APP_NAME}, and securely store them. All on ${ios}, ${android} and ${desktop}.`;

    return (
        <FeatureTourStepsContent
            bullets={props.bullets}
            title={<img src={logoDrive} alt={DRIVE_APP_NAME} />}
            illustration={driveAppBackground}
            illustrationSize="full"
            mainCTA={
                <ButtonLike as={AppLink} to="/" color="norm" fullWidth toApp={APPS.PROTONDRIVE} target="_blank">
                    {goToPlanOrAppNameText(DRIVE_APP_NAME)}
                </ButtonLike>
            }
            extraCTA={
                <FeatureTourStepCTA type="secondary" onClick={props.onNext}>
                    {c('Button').t`Maybe later`}
                </FeatureTourStepCTA>
            }
        >
            <p className="m-0">{description}</p>
        </FeatureTourStepsContent>
    );
};

export default ProtonDriveTourStep;
