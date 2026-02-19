import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { DESKTOP_PLATFORMS } from '@proton/shared/lib/constants';
import macosImg from '@proton/styles/assets/img/onboarding/drive-v2-macos.svg';
import windowsImg from '@proton/styles/assets/img/onboarding/drive-v2-windows.svg';

import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { Container } from '../Container';
import { IconList } from '../IconList';
import type { OnboardingProps } from '../interface';

type Props = OnboardingProps & {
    download: () => void;
    platform: DESKTOP_PLATFORMS;
};

export const DesktopAppStep = ({ platform }: Props) => {
    return (
        <Container
            title={c('Onboarding Info').t`Get the desktop app`}
            subtitle={c('Onboarding Info').t`Work faster, smarter`}
            image={platform === DESKTOP_PLATFORMS.MACOS ? macosImg : windowsImg}
        >
            <IconList
                items={[
                    {
                        icon: 'bolt',
                        text: c('Onboarding Info').t`Faster uploads for large or multiple files`,
                    },
                    {
                        icon: 'tv',
                        text: c('Onboarding Info').t`Organize files right from your desktop`,
                    },
                    {
                        icon: 'broom',
                        text: c('Onboarding Info').t`Free up hard drive space on your computer`,
                    },
                ]}
            />
        </Container>
    );
};

export const DesktopAppStepButtons = ({ platform, download, onNext }: Props) => {
    return (
        <div className="w-full flex justify-space-between">
            <Button
                size="large"
                shape="ghost"
                color="norm"
                onClick={() => {
                    void countActionWithTelemetry(Actions.OnboardingV2InstallSkip);
                    onNext();
                }}
            >
                {c('Onboarding Action').t`Install later`}
            </Button>

            <Button
                className="flex items-center justify-center gap-2"
                size="large"
                color="norm"
                onClick={() => {
                    if (platform === DESKTOP_PLATFORMS.MACOS) {
                        void countActionWithTelemetry(Actions.OnboardingV2InstallMacApp);
                    } else if (
                        platform === DESKTOP_PLATFORMS.WINDOWS ||
                        platform === DESKTOP_PLATFORMS.WINDOWS_X64 ||
                        platform === DESKTOP_PLATFORMS.WINDOWS_ARM
                    ) {
                        void countActionWithTelemetry(Actions.OnboardingV2InstallWindowsApp);
                    }

                    download();
                    onNext();
                }}
            >
                <IcArrowDownLine />
                <span>{c('Onboarding Action').t`Install and continue`}</span>
            </Button>
        </div>
    );
};
