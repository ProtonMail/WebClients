import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Organization } from '@proton/shared/lib/interfaces';

import { AlertModal, ModalProps } from '../../components';

interface Props extends ModalProps {
    organization: Organization;
    onConfirm: () => void;
}

const LossLoyaltyModal = ({ organization, onConfirm, onClose, ...rest }: Props) => {
    const bonusSpace = organization.BonusSpace && humanSize(organization.BonusSpace, 'GB');

    return (
        <AlertModal
            title={c('Title').t`Confirm loss of ${BRAND_NAME} bonuses`}
            buttons={[
                <Button
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                    color="danger"
                >
                    {c('Action').t`Remove bonuses`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            onClose={onClose}
            {...rest}
        >
            <div className="mb1">
                {c('Info').t`Since you're a loyal user, your account has additional features enabled.`}
            </div>
            <div>
                {c('Info')
                    .t`By downgrading to a Free plan, you will permanently lose these benefits, even if you upgrade again in the future.`}
                <ul>
                    {organization.BonusSpace ? <li>{c('Info').t`+${bonusSpace} bonus storage`}</li> : null}
                    {organization.BonusVPN ? (
                        <li>
                            {c('Info').ngettext(
                                msgid`+${organization.BonusVPN} connection for ${VPN_APP_NAME} (allows you to connect more devices to VPN)`,
                                `+${organization.BonusVPN} connections for ${VPN_APP_NAME} (allows you to connect more devices to VPN)`,
                                organization.BonusVPN
                            )}
                        </li>
                    ) : null}
                </ul>
            </div>
        </AlertModal>
    );
};

export default LossLoyaltyModal;
