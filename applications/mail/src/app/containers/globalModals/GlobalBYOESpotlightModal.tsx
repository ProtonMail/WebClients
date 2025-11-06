import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Icon, SettingsLink, useModalState } from '@proton/components';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import { APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import byoeSpolightImg from '@proton/styles/assets/img/illustrations/byoe-spotlight.svg';

import { useMailGlobalModals } from './GlobalModalProvider';
import type { BYOESpotlightModalPayload } from './inteface';
import { ModalType } from './inteface';

export const GlobalBYOESpotlightModal = () => {
    const { subscribe } = useMailGlobalModals();

    const [modalProps, setOpen, shouldRender] = useModalState();
    const [byoeSpotlightModalProps, setBYOESpotlightModalProps] = useState<BYOESpotlightModalPayload['value'] | null>(
        null
    );

    useEffect(() => {
        const unsubscribe = subscribe((payload) => {
            if (payload.type === ModalType.BYOESpotlight) {
                setOpen(true);
                setBYOESpotlightModalProps(payload.value);
            }
        });
        return unsubscribe;
    }, [subscribe, setOpen, setBYOESpotlightModalProps]);

    const onDisplayed = byoeSpotlightModalProps?.onDisplayed;
    useEffect(() => {
        if (shouldRender) {
            onDisplayed?.();
        }
    }, [shouldRender, onDisplayed]);

    const forwardingCount = byoeSpotlightModalProps?.forwardingSyncs.length || 0;

    const addressesSettingsLink = (
        <SettingsLink path="/identity-addresses#addresses" app={APPS.PROTONMAIL} key="addresses-section-link">
            {c('Info').t`Addresses settings`}
        </SettingsLink>
    );

    return (
        <>
            {shouldRender && byoeSpotlightModalProps && (
                <ModalTwo {...modalProps} size="xsmall">
                    <ModalTwoContent unstyled>
                        <div
                            className="relative flex justify-center items-center h-custom bg-lowered"
                            style={{ '--h-custom': '11rem' }}
                        >
                            <ModalHeaderCloseButton buttonProps={{ className: 'absolute right-0 top-0 mt-3 mr-3' }} />
                            <img src={byoeSpolightImg} alt="" />
                        </div>
                        <div className="mx-8 mt-8 mb-4 text-center">
                            <h1 className="text-lg text-bold">{c('loc_nightly: BYOE')
                                .t`Use Gmail securely in ${MAIL_APP_NAME}`}</h1>
                            <div className="my-4 color-weak">
                                {c('loc_nightly: BYOE')
                                    .jt`Send and receive Gmail correspondence directly in ${MAIL_APP_NAME}. Connect your address in ${addressesSettingsLink}.`}
                            </div>
                            {forwardingCount > 0 && (
                                <div className="border border-weak rounded flex flex-nowrap gap-2 p-3 color-weak text-left">
                                    <Icon className="flex shrink-0 mt-0.5 mb-auto" name="light-lightbulb" />
                                    <div>
                                        {c('loc_nightly: BYOE').ngettext(
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
                        >{c('loc_nightly: BYOE').t`Connect to Gmail`}</ButtonLike>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </>
    );
};
