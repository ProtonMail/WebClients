import { c } from 'ttag';

import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { BRAND_NAME, LUMO_SHORT_APP_NAME, MAIL_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import secondIconDark from '@proton/styles/assets/img/lumo/screen-lock-dark.svg';
import secondIcon from '@proton/styles/assets/img/lumo/screen-lock.svg';
import thirdIconDark from '@proton/styles/assets/img/lumo/screen-reload-dark.svg';
import thirdIcon from '@proton/styles/assets/img/lumo/screen-reload.svg';
import fourthIconDark from '@proton/styles/assets/img/lumo/swiss-lock-dark.svg';
import fourthIcon from '@proton/styles/assets/img/lumo/swiss-lock.svg';
import firstIconDark from '@proton/styles/assets/img/lumo/web-view-noeyes-dark.svg';
import firstIcon from '@proton/styles/assets/img/lumo/web-view-noeyes.svg';

import { useLumoTheme } from '../../providers';
import LumoOnboardingCatInline from '../Icons/LumoOnboardingCatInline';

import './OnboardingModal.scss';

interface Props {
    onClick?: () => void;
}

const OnboardingModal = ({ onClick, ...modalProps }: Props & ModalProps) => {
    const { isDarkLumoTheme } = useLumoTheme();
    const lumoCharacteristics = [
        {
            title: c('collider_2025: Characteristic Title').t`Your chats are yours alone`,
            characteristic: c('collider_2025: Characteristic')
                .t`We keep no logs of what you ask, or what ${LUMO_SHORT_APP_NAME} replies. Your chats can’t be seen, shared, or used to profile you. ${LUMO_SHORT_APP_NAME} saves nothing on our servers.`,
            img: isDarkLumoTheme ? firstIconDark : firstIcon,
        },
        {
            title: c('collider_2025: Characteristic Title').t`Only you have access`,
            characteristic: c('collider_2025: Characteristic')
                .t`Thanks to zero-access encryption, your saved conversations can only be decoded and read on your device. Neither ${BRAND_NAME} nor anyone else can see them.`,
            img: isDarkLumoTheme ? secondIconDark : secondIcon,
        },
        {
            title: c('collider_2025: Characteristic Title').t`Tech that you can trust`,
            characteristic: c('collider_2025: Characteristic')
                .t`${LUMO_SHORT_APP_NAME}’s code is fully open source, so anyone can independently verify that it’s private and secure—and that we never use your data to train the model.`,
            img: isDarkLumoTheme ? thirdIconDark : thirdIcon,
        },
        {
            title: c('collider_2025: Characteristic Title').t`You’re in control`,
            characteristic: c('collider_2025: Characteristic')
                .t`Your data isn’t shared with advertisers, governments, or anyone else. ${LUMO_SHORT_APP_NAME} is a European service subject to GDPR, so you can delete your data anytime.`,
            img: isDarkLumoTheme ? fourthIconDark : fourthIcon,
        },
    ];
    return (
        <ModalTwo size="xlarge" className="onboarding-lumo-modal" disableCloseOnEscape {...modalProps}>
            <ModalTwoHeader hasClose />
            <ModalTwoContent>
                <div className="flex flex-column flex-nowrap gap-2 px-4">
                    <div className="mb-2 border-bottom border-weak">
                        <div className="flex flex-column md:flex-row flex-nowrap">
                            <div className="my-auto">
                                <h1 className="h3 text-bold mb-4">{c('collider_2025:Title')
                                    .t`The AI that respects your privacy`}</h1>
                                <p className="color-weak mb-4">{c('collider_2025:Title')
                                    .t`An AI assistant should empower you, not exploit you for your data. That’s why we built ${LUMO_SHORT_APP_NAME}: To bring you all the benefits of AI, without compromising your privacy and data security.`}</p>
                            </div>
                            <div className="shrink-0 flex">
                                <LumoOnboardingCatInline className="mt-auto mx-auto" />
                            </div>
                        </div>
                    </div>
                    <div className="mb-2">
                        <h2 className="text-lg text-bold mb-4">{c('collider_2025:Title')
                            .t`Built by the team that knows privacy`}</h2>

                        <p className="color-weak">{c('collider_2025:Info')
                            .t`AIs from Big Tech are built on harvesting your data. But ${LUMO_SHORT_APP_NAME} is different. It was created by the scientists behind innovative, privacy-first services like ${MAIL_APP_NAME} and ${VPN_APP_NAME}. And it’s owned by a Swiss nonprofit, whose mission is to advance privacy and never make money from user data.`}</p>
                    </div>
                    <div>
                        <h2 className="text-lg text-bold my-4">{c('collider_2025:Title')
                            .t`How does ${LUMO_SHORT_APP_NAME} keep our conversations confidential?`}</h2>
                        <div className="grid-auto-fill grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                            {lumoCharacteristics.map((characteristic) => (
                                <div className="flex-1 flex flex-column gap-2 flex-nowrap">
                                    <div className="py-4">
                                        <img className="shrink-0" alt="" src={characteristic.img}></img>
                                    </div>
                                    <h3 className="text-rg text-semibold color-primary">{characteristic.title}</h3>
                                    <p className="color-weak">{characteristic.characteristic}</p>
                                </div>
                            ))}{' '}
                        </div>
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter />
        </ModalTwo>
    );
};

export default OnboardingModal;
