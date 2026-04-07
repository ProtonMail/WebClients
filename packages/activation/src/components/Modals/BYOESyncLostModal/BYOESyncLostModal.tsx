import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';

export interface BYOESyncLostModalProps {
    disconnectedEmails: string[];
    onCustomClose?: () => void;
}

interface Props extends BYOESyncLostModalProps, ModalProps {
    onResolve: () => void;
    onReject: () => void;
}

const BYOESyncLostModal = ({ disconnectedEmails, onCustomClose, onResolve, onReject, ...rest }: Props) => {
    const handleClose = () => {
        onCustomClose?.();
        onReject();
    };

    const boldEmails = <strong key="bold-emails">{disconnectedEmails.join(', ')}</strong>;

    return (
        <ModalTwo size="small" {...rest} onClose={handleClose}>
            <ModalTwoHeader title={c('Title').t`Disconnected from Gmail`} />
            <ModalTwoContent>
                <div>{c('Description').jt`We can't access ${boldEmails} anymore.`}</div>
                <div>{c('Description').t`This may happen if permissions were removed or your password changed.`}</div>
                <div>
                    {disconnectedEmails.length > 1
                        ? c('Description')
                              .t`To continue receiving and sending Gmail messages in ${BRAND_NAME}, please reconnect your accounts.`
                        : c('Description')
                              .t`To continue receiving and sending Gmail messages in ${BRAND_NAME}, please reconnect your account.`}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="w-full" onClick={handleClose} shape="ghost">{c('Action').t`Cancel`}</Button>
                <ButtonLike
                    as={SettingsLink}
                    path="/identity-addresses#addresses"
                    app={APPS.PROTONMAIL}
                    className="w-full inline-flex items-center justify-center gap-2"
                    onClick={onResolve}
                >
                    <img src={googleLogo} alt="" />
                    <span>{c('Action').t`Reconnect to Gmail`}</span>
                </ButtonLike>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default BYOESyncLostModal;
