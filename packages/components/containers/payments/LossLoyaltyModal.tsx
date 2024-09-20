import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import { BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { Organization } from '@proton/shared/lib/interfaces';

interface Props extends ModalProps {
    organization: Organization;
    onConfirm: () => void;
}

const LossLoyaltyModal = ({ organization, onConfirm, onClose, ...rest }: Props) => {
    const bonusSpace = organization.BonusSpace && humanSize({ bytes: organization.BonusSpace, unit: 'GB' });

    return (
        <Prompt
            title={c('Title').t`Confirm loss of ${BRAND_NAME} bonuses`}
            buttons={[
                <Button
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                    color="danger"
                    data-testid="confirm-loss-btn"
                >
                    {c('Action').t`Remove bonuses`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            onClose={onClose}
            data-testid="confirm-loss"
            {...rest}
        >
            <div className="mb-4">
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
        </Prompt>
    );
};

export default LossLoyaltyModal;
