import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import { LUMO_SHORT_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import type { IconName } from '../../components/LumoIcon/LumoIcon';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { DesktopAppIllustration } from './DesktopAppIllustration';

import './DesktopOnboardingModal.scss';

/** 'download' on computers; 'got-it' on phones and in the iOS/Android apps, where there's nothing to install. */
export type DesktopOnboardingVariant = 'download' | 'got-it';

interface Feature {
    icon: IconName;
    title: string;
    description: string;
}

const getFeatures = (): Feature[] => {
    return [
        {
            icon: 'Blocks',
            title: c('collider_2025: Title').t`Connectors`,
            description: c('collider_2025: Description').t`Work with ${MAIL_APP_NAME}, local folders, Slack, and more.`,
        },
        {
            icon: 'Clock',
            title: c('collider_2025: Title').t`Schedules`,
            description: c('collider_2025: Description')
                .t`Set up recurring tasks like morning briefings, weekly recaps, and more.`,
        },
        {
            icon: 'ScrollText',
            title: c('collider_2025: Title').t`Skills`,
            description: c('collider_2025: Description')
                .t`Save instructions and preferences that ${LUMO_SHORT_APP_NAME} automatically applies across chats.`,
        },
    ];
};

interface DesktopOnboardingModalProps extends ModalProps {
    variant: DesktopOnboardingVariant;
    onDownload: () => void;
    onNotNow: () => void;
    onGotIt: () => void;
}

export const DesktopOnboardingModal = ({
    variant,
    onDownload,
    onNotNow,
    onGotIt,
    ...modalProps
}: DesktopOnboardingModalProps) => {
    const isSheet = variant === 'got-it';
    const titleId = 'desktop-onboarding-title';

    const heading = (
        <div className={clsx('flex flex-column flex-nowrap gap-2', isSheet && 'items-center text-center')}>
            <span className="text-sm text-semibold color-primary">{c('collider_2025: Label').t`New`}</span>
            <h2 id={titleId} className="text-5xl text-semibold color-norm m-0 lh-rg">
                {c('collider_2025: Title').t`Meet ${LUMO_SHORT_APP_NAME} for desktop`}
            </h2>
        </div>
    );

    const features = (
        <ul className="unstyled m-0 flex flex-column flex-nowrap gap-4">
            {getFeatures().map((feature) => {
                return (
                    <li key={feature.icon} className="flex flex-nowrap items-start gap-3">
                        <span
                            className="desktop-onboarding-fill flex shrink-0 items-center justify-center rounded-lg color-norm w-custom h-custom"
                            style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                        >
                            <LumoIcon name={feature.icon} size={16} strokeWidth={1.4} />
                        </span>
                        <span className="flex flex-column flex-nowrap flex-1 gap-0.5">
                            <span className="text-semibold color-norm">{feature.title}</span>
                            <span className="color-weak">{feature.description}</span>
                        </span>
                    </li>
                );
            })}
        </ul>
    );

    if (isSheet) {
        return (
            <ModalTwo
                {...modalProps}
                size="medium"
                className="desktop-onboarding-modal desktop-onboarding-modal--sheet"
                rootClassName="desktop-onboarding-modal-root--sheet"
                aria-labelledby={titleId}
            >
                <div className="flex flex-column flex-nowrap gap-6 overflow-auto px-4 pt-6 pb-4">
                    <div className="flex justify-center">
                        <DesktopAppIllustration />
                    </div>
                    {heading}
                    {features}
                    <p className="m-0 color-weak text-center">{c('collider_2025: Description')
                        .t`You can download it on your computer later.`}</p>
                    <Button color="norm" size="large" fullWidth onClick={onGotIt}>
                        {c('collider_2025: Action').t`Got it`}
                    </Button>
                </div>
            </ModalTwo>
        );
    }

    return (
        <ModalTwo {...modalProps} className="desktop-onboarding-modal" aria-labelledby={titleId}>
            {/* flex-auto, not flex-1: on narrow windows the dialog has no set height, and a 0 basis collapsed it to nothing. */}
            {/* Two columns need the full 840px dialog, so they start at lg; narrower windows get the text column only. */}
            <div className="flex flex-column lg:flex-row flex-nowrap flex-auto overflow-auto">
                <div
                    className="flex flex-column flex-nowrap justify-space-between gap-8 shrink-0 px-6 pt-8 pb-6 sm:px-10 sm:pt-10 sm:pb-8 lg:w-custom"
                    style={{ '--lg-w-custom': '27.5rem' }}
                >
                    <div className="flex flex-column flex-nowrap gap-5">
                        {heading}
                        {features}
                    </div>
                    <div className="flex flex-column-reverse sm:flex-row flex-nowrap sm:items-center justify-space-between gap-2">
                        <Button shape="ghost" onClick={onNotNow}>
                            {c('collider_2025: Action').t`Not now`}
                        </Button>
                        <Button
                            color="norm"
                            onClick={onDownload}
                            className="inline-flex items-center justify-center flex-nowrap gap-2"
                        >
                            <LumoIcon name="Download" size={16} strokeWidth={1.4} />
                            {c('collider_2025: Action').t`Download the desktop app`}
                        </Button>
                    </div>
                </div>
                <div className="desktop-onboarding-fill hidden lg:flex flex-1 items-center justify-center">
                    <DesktopAppIllustration />
                </div>
            </div>
        </ModalTwo>
    );
};
