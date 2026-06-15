import { c } from 'ttag';

import type { ModalProps } from '@proton/components';
import {
    DriveLogo,
    MailLogo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    VpnLogo,
} from '@proton/components';
import { BRAND_NAME, LUMO_SHORT_APP_NAME, MAIL_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

import './OnboardingModal.scss';

interface Props {
    onClick?: () => void;
}

const EyeOnboardingIcon = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
                d="M10.733 5.076C13.0624 4.7984 15.4186 5.29082 17.4419 6.47805C19.4651 7.66528 21.0442 9.48208 21.938 11.651C22.0213 11.8755 22.0213 12.1225 21.938 12.347C21.5705 13.238 21.0848 14.0755 20.494 14.837"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14.084 14.158C13.5182 14.7045 12.7604 15.0069 11.9738 15C11.1872 14.9932 10.4348 14.6777 9.87854 14.1215C9.32232 13.5652 9.00681 12.8128 8.99998 12.0262C8.99314 11.2396 9.29552 10.4818 9.842 9.916"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.479 17.499C16.1525 18.2848 14.6725 18.776 13.1394 18.9394C11.6063 19.1028 10.056 18.9345 8.59363 18.4459C7.13131 17.9573 5.7912 17.1599 4.66421 16.1077C3.53723 15.0556 2.64975 13.7734 2.062 12.348C1.97866 12.1235 1.97866 11.8765 2.062 11.652C2.94863 9.50186 4.50867 7.69725 6.508 6.509"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M2 2L22 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

const KeyOnboardingIcon = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
                d="M12.4 2.7C12.8623 2.27126 13.4695 2.03303 14.1 2.03303C14.7305 2.03303 15.3377 2.27126 15.8 2.7L21.3 8.2C21.7287 8.66229 21.967 9.2695 21.967 9.9C21.967 10.5305 21.7287 11.1377 21.3 11.6L17.6 15.3C17.1377 15.7287 16.5305 15.967 15.9 15.967C15.2695 15.967 14.6623 15.7287 14.2 15.3L8.7 9.8C8.27127 9.33771 8.03304 8.7305 8.03304 8.1C8.03304 7.4695 8.27127 6.86229 8.7 6.4L12.4 2.7Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14 7L17 10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M9.4 10.6L2.586 17.414C2.2109 17.789 2.00011 18.2976 2 18.828V21C2 21.2652 2.10536 21.5196 2.29289 21.7071C2.48043 21.8946 2.73478 22 3 22H6C6.26522 22 6.51957 21.8946 6.70711 21.7071C6.89464 21.5196 7 21.2652 7 21V20C7 19.7348 7.10536 19.4804 7.29289 19.2929C7.48043 19.1054 7.73478 19 8 19H9C9.26522 19 9.51957 18.8946 9.70711 18.7071C9.89464 18.5196 10 18.2652 10 18V17C10 16.7348 10.1054 16.4804 10.2929 16.2929C10.4804 16.1054 10.7348 16 11 16H11.172C11.7024 15.9999 12.211 15.7891 12.586 15.414L13.4 14.6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const ShieldOnboardingIcon = () => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M20 13C20 18 16.5 20.5 12.34 21.95C12.1222 22.0238 11.8855 22.0203 11.67 21.94C7.5 20.5 4 18 4 13V6.00001C4 5.73479 4.10536 5.48044 4.29289 5.2929C4.48043 5.10536 4.73478 5.00001 5 5.00001C7 5.00001 9.5 3.80001 11.24 2.28001C11.4519 2.09901 11.7214 1.99956 12 1.99956C12.2786 1.99956 12.5481 2.09901 12.76 2.28001C14.51 3.81001 17 5.00001 19 5.00001C19.2652 5.00001 19.5196 5.10536 19.7071 5.2929C19.8946 5.48044 20 5.73479 20 6.00001V13Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M9 12L11 14L15 10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const BoltOnboardingIcon = () => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M21 16V7.99999C20.9996 7.64927 20.9071 7.3048 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.26999L13 2.26999C12.696 2.09446 12.3511 2.00204 12 2.00204C11.6489 2.00204 11.304 2.09446 11 2.26999L4 6.26999C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.3048 3.00036 7.64927 3 7.99999V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const OnboardingModal = ({ onClick, ...modalProps }: Props & ModalProps) => {
    const lumoCharacteristics = [
        {
            key: 0,
            title: c('collider_2025: Characteristic Title').t`Your chats are yours alone`,
            characteristic: c('collider_2025: Characteristic')
                .t`We keep no logs of what you ask, or what ${LUMO_SHORT_APP_NAME} replies. Your chats can't be seen, shared, or used to profile you. ${LUMO_SHORT_APP_NAME} saves nothing on our servers.`,
            img: EyeOnboardingIcon,
        },
        {
            key: 1,
            title: c('collider_2025: Characteristic Title').t`Only you have access`,
            characteristic: c('collider_2025: Characteristic')
                .t`Thanks to zero-access encryption, your saved conversations can only be decoded and read on your device. Neither ${BRAND_NAME} nor anyone else can see them.`,
            img: KeyOnboardingIcon,
        },
        {
            key: 2,
            title: c('collider_2025: Characteristic Title').t`Tech that you can trust`,
            characteristic: c('collider_2025: Characteristic')
                .t`${LUMO_SHORT_APP_NAME}'s code is fully open source, so anyone can independently verify that it's private and secure—and that we never use your data to train the model.`,
            img: ShieldOnboardingIcon,
        },
        {
            key: 3,
            title: c('collider_2025: Characteristic Title').t`You're in control`,
            characteristic: c('collider_2025: Characteristic')
                .t`Your data isn't shared with advertisers, governments, or anyone else. ${LUMO_SHORT_APP_NAME} is a European service subject to GDPR, so you can delete your data anytime.`,
            img: BoltOnboardingIcon,
        },
    ];

    return (
        <ModalTwo size="xlarge" className="onboarding-lumo-modal" disableCloseOnEscape {...modalProps}>
            <ModalTwoHeader hasClose />
            <ModalTwoContent>
                <div className="onboarding-modal flex flex-column flex-nowrap gap-2 px-4">
                    <div>
                        <h1 className="h3 text-bold mb-4 main-text">{c('collider_2025:Title')
                            .t`The AI that respects your privacy`}</h1>
                        <p className="color-weak mb-2">{c('collider_2025:Title')
                            .t`An AI assistant should empower you, not exploit you for your data.`}</p>
                        <p className="color-weak">{c('collider_2025:Title')
                            .t`That's why we built ${LUMO_SHORT_APP_NAME}: To bring you all the benefits of AI, without compromising your privacy and data security.`}</p>
                    </div>
                    <div>
                        <div className="flex flex-row items-center gap-2 mb-4">
                            <h2 className="text-lg text-bold">{c('collider_2025:Title')
                                .t`Built by the team that knows privacy`}</h2>
                            <MailLogo variant="glyph-only" hasTitle={false} />
                            <DriveLogo variant="glyph-only" hasTitle={false} />
                            <VpnLogo variant="glyph-only" hasTitle={false} />
                        </div>
                        <p className="color-weak">{c('collider_2025:Info')
                            .t`AIs from Big Tech are built on harvesting your data. But ${LUMO_SHORT_APP_NAME} is different. It was created by the scientists behind innovative, privacy-first services like ${MAIL_APP_NAME} and ${VPN_APP_NAME}. And it's owned by a Swiss nonprofit, whose mission is to advance privacy and never make money from user data.`}</p>
                    </div>
                    <div>
                        <h2 className="text-lg text-bold my-4">{c('collider_2025:Title')
                            .t`How does ${LUMO_SHORT_APP_NAME} keep our conversations confidential?`}</h2>
                        <div className="grid-auto-fill grid-cols-1 sm:grid-cols-2 gap-5">
                            {lumoCharacteristics.map((characteristic) => {
                                const Icon = characteristic.img;
                                return (
                                    <div
                                        key={characteristic.key}
                                        className="character-card flex flex-column gap-2 flex-nowrap p-4 rounded-lg"
                                    >
                                        <div className="flex flex-row items-center gap-2">
                                            <Icon />
                                            <h3 className="text-lg text-semibold">{characteristic.title}</h3>
                                        </div>
                                        <p className="color-weak">{characteristic.characteristic}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter />
        </ModalTwo>
    );
};

export default OnboardingModal;
