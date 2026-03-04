import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { APPS } from '@proton/shared/lib/constants';
import byoeSetupSuccess from '@proton/styles/assets/img/illustrations/byoe-setup-success.svg';

interface Props extends ModalProps {}

export const BYOESetupSuccessModal = ({ onClose, ...rest }: Props) => {
    const location = useLocation();

    // If we're already in the correct settings section, no need to show the button
    const showManageAddressesButton = !location.pathname.includes('identity-addresses');

    return (
        <ModalTwo size="small" {...rest} onClose={onClose}>
            <ModalTwoHeader />
            <ModalTwoContent className="flex justify-center items-center text-center">
                <img src={byoeSetupSuccess} alt="" width={260} height={148} />
                <div className="text-bold text-xl">{c('loc_nightly: BYOE').t`Your Gmail address is connected`}</div>
                <div className="color-weak mt-2">
                    {c('loc_nightly: BYOE').t`We're importing your recent messages. We'll email you when it's done.`}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="norm" className="w-full inline-flex items-center justify-center gap-2" onClick={onClose}>
                    {c('Action').t`Done`}
                </Button>
                {showManageAddressesButton && (
                    <ButtonLike
                        as={SettingsLink}
                        path="/identity-addresses#addresses"
                        app={APPS.PROTONMAIL}
                        className="w-full"
                    >{c('Action').t`Manage addresses`}</ButtonLike>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};
