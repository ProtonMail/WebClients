import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcArrowOutSquare, IcCheckmark } from '@proton/icons';
import { AUTHENTICATOR_APP_NAME, BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

import authenticatorLogo from './assets/authenticator-logo.svg';
import authenticatorGraphic from './assets/authenticator.jpg';

interface AuthenticatorModalProps {
    open: boolean;
    onClose: () => void;
    onExit: () => void;
}

const AuthenticatorPromotionModal = ({ open, onClose, onExit }: AuthenticatorModalProps) => {
    return (
        <Modal open={open} onClose={onClose} onExit={onExit} size="xlarge">
            <div className="flex flex-nowrap h-full">
                <div className="modal-two-dialog-container md:w-1/2">
                    <ModalHeader
                        title={c('Title').t`Try ${AUTHENTICATOR_APP_NAME}`}
                        subline={c('Info')
                            .t`The most secure and private two-factor authentication app, that's free and open-source.`}
                        closeButtonProps={{ className: 'absolute top-0 right-0 mt-3 mr-3' }}
                        className="pt-4 md:pt-0 pb-4 md:pb-0 text-center md:text-left"
                        titleClassName="mb-2"
                        leadingContent={
                            <img src={authenticatorLogo} alt="" className="md:hidden m-2" width={50} height={50} />
                        }
                    />
                    <ModalContent>
                        <p className="m-0">{c('Info').t`With ${AUTHENTICATOR_APP_NAME}, you can:`}</p>
                        <ul className="unstyled flex flex-column flex-nowrap gap-2 mt-1">
                            <li className="flex align-baseline gap-2 flex-nowrap">
                                <IcCheckmark className="color-primary shrink-0 mt-0.5" />
                                <div>
                                    {getBoldFormattedText(
                                        c('Info')
                                            .t`**Import your existing codes** from other 2FA apps, like Google Authenticator`
                                    )}
                                </div>
                            </li>
                            <li className="flex align-baseline gap-2 flex-nowrap">
                                <IcCheckmark className="color-primary shrink-0 mt-0.5" />
                                <div>{getBoldFormattedText(c('Info').t`**Sync codes** to all your devices`)}</div>
                            </li>
                            <li className="flex align-baseline gap-2 flex-nowrap">
                                <IcCheckmark className="color-primary shrink-0 mt-0.5" />
                                <div>
                                    {getBoldFormattedText(c('Info').t`**Enable automatic backups** for peace of mind`)}
                                </div>
                            </li>
                        </ul>
                        <p className="m-0 mt-2">
                            {getBoldFormattedText(
                                c('Info')
                                    .t`It won't be linked to your ${BRAND_NAME} Account, so there's **no risk of getting locked out**.`
                            )}
                        </p>
                    </ModalContent>
                    <ModalFooter>
                        <div className="flex flex-column gap-2 w-full">
                            <ButtonLike
                                as="a"
                                href={getStaticURL('/authenticator')}
                                color="norm"
                                className="flex flex-nowrap gap-2 items-center justify-center"
                                fullWidth
                            >
                                {getPlanOrAppNameText(AUTHENTICATOR_APP_NAME)}
                                <IcArrowOutSquare className="shrink-0" />
                            </ButtonLike>
                            <Button color="norm" shape="ghost" onClick={onClose} fullWidth>{c('Info')
                                .t`Maybe later`}</Button>
                        </div>
                    </ModalFooter>
                </div>
                <div className="hidden md:flex w-1/2">
                    <img
                        src={authenticatorGraphic}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'left bottom' }}
                        width={392}
                        height={239}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default AuthenticatorPromotionModal;
