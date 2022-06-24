import { c } from 'ttag';

import { MAIL_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

import { Alert, AlertModal, Button, ModalProps } from '../../components';

interface Props extends ModalProps {
    hasMail: boolean;
    hasVpn: boolean;
    onConfirm: () => void;
}

const DowngradeModal = ({ hasMail, hasVpn, onConfirm, onClose, ...rest }: Props) => {
    const hasBundle = hasMail && hasVpn;

    return (
        <AlertModal
            title={c('Title').t`Confirm downgrade`}
            buttons={[
                <Button
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                    color="norm"
                >
                    {c('Action').t`Downgrade`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            onClose={onClose}
            {...rest}
        >
            <Alert className="mb1" type="error">
                {(() => {
                    if (hasBundle) {
                        return c('Info')
                            .t`If you proceed with the downgrade, you will lose access to ${MAIL_APP_NAME} and ${VPN_APP_NAME} paid features.`;
                    }

                    if (hasMail) {
                        return c('Info')
                            .t`If you proceed with the downgrade, you will lose access to ${MAIL_APP_NAME} paid features, including additional storage and filters.`;
                    }

                    return c('Info')
                        .t`If you proceed with the downgrade, you will lose access to ${VPN_APP_NAME} paid features.`;
                })()}
            </Alert>
            <Alert type="warning">
                {[
                    hasMail &&
                        c('Info')
                            .t`You must disable or remove any additional ${MAIL_APP_NAME} users, addresses, and custom domains before you can downgrade.`,
                    hasVpn && c('Info').t`Downgrading will terminate any connections to paid ${VPN_APP_NAME} servers.`,
                ]
                    .filter(Boolean)
                    .join(' ')}
            </Alert>
        </AlertModal>
    );
};

export default DowngradeModal;
