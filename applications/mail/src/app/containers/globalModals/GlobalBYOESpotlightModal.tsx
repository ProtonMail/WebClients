import { useEffect } from 'react';

import { c, msgid } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { IcLightLightbulb } from '@proton/icons/icons/IcLightLightbulb';
import { APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import byoeSpolightImg from '@proton/styles/assets/img/illustrations/byoe-spotlight.svg';

import type { BYOESpotlightModalPayload } from './inteface';

interface GlobalBYOESpotlightModalProps {
    value: BYOESpotlightModalPayload['value'];
    modalProps: ModalStateProps;
}

export const GlobalBYOESpotlightModal = ({
    value: byoeSpotlightModalProps,
    modalProps,
}: GlobalBYOESpotlightModalProps) => {
    const { onDisplayed } = byoeSpotlightModalProps;
    useEffect(() => {
        onDisplayed();
    }, [onDisplayed]);

    const forwardingCount = byoeSpotlightModalProps.forwardingSyncs.length;

    const addressesSettingsLink = (
        <SettingsLink path="/identity-addresses#addresses" app={APPS.PROTONMAIL} key="addresses-section-link">
            {c('Info').t`Addresses settings`}
        </SettingsLink>
    );

    return (
        <ModalTwo {...modalProps} size="xsmall">
            <ModalTwoContent unstyled>
                <div
                    className="relative flex justify-center items-center h-custom bg-lowered"
                    style={{ '--h-custom': '11rem' }}
                >
                    <ModalHeaderCloseButton
                        buttonProps={{
                            className: 'absolute right-0 top-0 mt-3 mr-3',
                        }}
                    />
                    <img src={byoeSpolightImg} alt="" />
                </div>
                <div className="mx-8 mt-8 mb-4 text-center">
                    <h1 className="text-lg text-bold">{c('Title').t`Use Gmail securely in ${MAIL_APP_NAME}`}</h1>
                    <div className="my-4 color-weak">
                        {c('Description')
                            .jt`Send and receive Gmail messages directly in ${MAIL_APP_NAME}. Connect your address in ${addressesSettingsLink}.`}
                    </div>
                    {forwardingCount > 0 && (
                        <div className="border border-weak rounded flex flex-nowrap gap-2 p-3 color-weak text-left">
                            <IcLightLightbulb className="flex shrink-0 mt-0.5 mb-auto" />
                            <div>
                                {c('Description').ngettext(
                                    msgid`You're forwarding emails from ${forwardingCount} Gmail address. By connecting it, you'll be able to both receive and reply in ${MAIL_APP_NAME}`,
                                    `You're forwarding emails from ${forwardingCount} Gmail addresses. By connecting them, you'll be able to both receive and reply in ${MAIL_APP_NAME}`,
                                    forwardingCount
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="px-4 pb-4">
                <ButtonLike
                    as={SettingsLink}
                    path="/identity-addresses#addresses"
                    app={APPS.PROTONMAIL}
                    className="w-full"
                    color="norm"
                >{c('Action').t`Connect your email`}</ButtonLike>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
