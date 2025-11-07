import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_ANDROID_APP, DRIVE_IOS_APP } from '@proton/shared/lib/drive/urls';
import { isAndroid, isIos, isMobile } from '@proton/shared/lib/helpers/browser';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';
import androidImg from '@proton/styles/assets/img/onboarding/drive-v2-android.png';
import iosImg from '@proton/styles/assets/img/onboarding/drive-v2-ios.png';
import mobileImg from '@proton/styles/assets/img/onboarding/drive-v2-mobile.svg';

import { Container } from '../Container';
import { IconList } from '../IconList';
import type { OnboardingProps } from '../interface';

export const MobileAppStep = () => {
    let image = mobileImg;
    let title = c('Onboarding Info').t`Get the mobile app`;

    if (isMobile() && isIos()) {
        image = iosImg;
        title = c('Onboarding Info').t`Got an iPhone? We've got you covered.`;
    } else if (isMobile() && isAndroid()) {
        image = androidImg;
        title = c('Onboarding Info').t`Got an Android? We've got you covered.`;
    }

    return (
        <Container title={title} subtitle={c('Onboarding Info').t`Work faster, smarter`} image={image}>
            <IconList
                items={[
                    !isMobile() && {
                        text: c('Onboarding Info').t`Scan the QR code to install the mobile app`,
                    },
                    {
                        icon: 'image',
                        text: c('Onboarding Info').t`Backup your photos and memories`,
                    },
                    {
                        icon: 'mobile',
                        text: c('Onboarding Info').t`Access your files on the go`,
                    },
                ]}
            />

            {!isMobile() && (
                <div className="mt-10 flex items-center justify-center gap-4">
                    <Href href={DRIVE_ANDROID_APP}>
                        <img width="140" src={playStoreSvg} alt={c('Info').t`${DRIVE_APP_NAME} on Play Store`} />
                    </Href>
                    <Href href={DRIVE_IOS_APP}>
                        <img width="140" src={appStoreSvg} alt={c('Info').t`${DRIVE_APP_NAME} on App Store`} />
                    </Href>
                </div>
            )}
        </Container>
    );
};

export const MobileAppStepButtons = ({ onNext }: OnboardingProps) => {
    return (
        <div className="w-full flex flex-column md:flex-row gap-2 md:justify-end">
            {isMobile() && (isIos() || isAndroid()) ? (
                <>
                    <Button
                        size="large"
                        color="norm"
                        onClick={() => {
                            window.open(isIos() ? DRIVE_IOS_APP : DRIVE_ANDROID_APP, '_blank');
                            onNext();
                        }}
                    >
                        {c('Onboarding Action').t`Try the app`}
                    </Button>
                    <Button size="large" color="norm" shape="ghost" onClick={onNext}>
                        {c('Onboarding Action').t`Skip`}
                    </Button>
                </>
            ) : (
                <Button size="large" color="norm" onClick={onNext}>
                    {c('Onboarding Action').t`Continue`}
                </Button>
            )}
        </div>
    );
};
