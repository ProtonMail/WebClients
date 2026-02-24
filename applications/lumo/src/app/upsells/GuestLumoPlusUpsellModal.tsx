import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ModalProps } from '@proton/components';
import { SettingsLink } from '@proton/components';
import Prompt from '@proton/components/components/prompt/Prompt';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoGuestUpsell from '@proton/styles/assets/img/lumo/lumo-guest-upsell.svg';

import LumoPlusBackdropOverlay from './LumoPlusBackdropOverlay';

const GuestLumoPlusUpsellModal = ({ ...modalProps }: ModalProps) => {
    return (
        <>
            <LumoPlusBackdropOverlay show />
            <Prompt
                {...modalProps}
                className="modal-two--no-backdrop"
                buttons={[
                    <ButtonLike as={SettingsLink} className="w-full" shape="solid" color="warning" path="/signup">{c(
                        'collider_2025: Upsell'
                    ).t`Upgrade`}</ButtonLike>,
                    <Button shape="ghost" className="w-full" color="norm" onClick={modalProps.onClose}>{c(
                        'collider_2025: Info'
                    ).t`Maybe later`}</Button>,
                ]}
            >
                <div className="flex flex-column gap-2">
                    <div className="flex items-center flex-column">
                        <img src={lumoGuestUpsell} alt="" />
                    </div>

                    <p className="color-weak text-center m-0">{c('collider_2025: Info')
                        .t`Try the smartest version of ${LUMO_SHORT_APP_NAME} with advanced capabilities.`}</p>
                </div>
            </Prompt>
        </>
    );
};

export default GuestLumoPlusUpsellModal;
