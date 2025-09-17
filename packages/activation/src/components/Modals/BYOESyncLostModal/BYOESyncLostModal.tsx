import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
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

    const boldEmails = <strong>{disconnectedEmails.join(', ')}</strong>;

    return (
        <ModalTwo size="small" {...rest} onClose={handleClose}>
            <ModalTwoHeader title={c('loc_nightly: BYOE').t`Disconnected from Gmail`} />
            <ModalTwoContent>
                <div>{c('loc_nightly: BYOE').jt`We can't access ${boldEmails} anymore.`}</div>
                <div>
                    {c('loc_nightly: BYOE').t`This may happen if permissions were removed or your password changed.`}
                </div>
                <div>
                    {disconnectedEmails.length > 1
                        ? c('loc_nightly: BYOE')
                              .t`To continue receiving and sending Gmail messages in ${BRAND_NAME}, please reconnect your accounts.`
                        : c('loc_nightly: BYOE')
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
                    <span>{c('loc_nightly: BYOE').t`Reconnect to Gmail`}</span>
                </ButtonLike>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default BYOESyncLostModal;
