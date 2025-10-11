import { c } from 'ttag';

import { userSettingsThunk } from '@proton/account';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import useInboxDesktopVersion from '@proton/components/containers/desktop/useInboxDesktopVersion';
import { isDesktopInboxUser } from '@proton/shared/lib/helpers/usedClientsFlags';
import desktopAppBackground from '@proton/styles/assets/img/onboarding/feature_tour-desktop-app-background.svg';

import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepCTA from './components/FeatureTourStepCTA';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';

export const shouldDisplayDesktopAppTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [userSettings] = await Promise.all([dispatch(userSettingsThunk())]);
    return {
        canDisplay: !isDesktopInboxUser(BigInt(userSettings.UsedClientFlags)),
        preloadUrls: [desktopAppBackground],
    };
};

export const DesktopAppTourStep = (props: FeatureTourStepProps) => {
    const { desktopAppLink, loading } = useInboxDesktopVersion();

    return (
        <FeatureTourStepsContent
            bullets={props.bullets}
            title={c('Title').t`Distraction-free emailing`}
            illustrationSize="full"
            illustration={desktopAppBackground}
            mainCTA={
                <ButtonLike as={'a'} loading={loading} color="norm" fullWidth href={desktopAppLink} download>{c(
                    'Action'
                ).t`Download the desktop app`}</ButtonLike>
            }
            extraCTA={
                <FeatureTourStepCTA type="secondary" onClick={props.onNext}>
                    {c('Button').t`Maybe later`}
                </FeatureTourStepCTA>
            }
        >
            <p className="m-0">{c('Info').t`Enjoy a faster, focused emailing experience with the desktop app.`}</p>
        </FeatureTourStepsContent>
    );
};

export default DesktopAppTourStep;
