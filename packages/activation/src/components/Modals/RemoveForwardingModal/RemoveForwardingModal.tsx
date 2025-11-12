import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Prompt } from '@proton/components';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { MAX_SYNC_PAID_USER } from '../../../constants';

interface Props extends ModalStateProps {}

const RemoveForwardingModal = ({ ...rest }: Props) => {
    return (
        <Prompt
            title={c('Title').t`Remove forwarding address`}
            buttons={[<Button onClick={rest.onClose}>{c('Action').t`Got it`}</Button>]}
            {...rest}
        >
            <div>{c('loc_nightly: BYOE')
                .t`To connect a different Gmail address, remove extra Gmail addresses forwarding to ${BRAND_NAME}.`}</div>
            <div>
                {c('loc_nightly: BYOE').ngettext(
                    msgid`Your plan supports a total of ${MAX_SYNC_PAID_USER} Gmail address`,
                    `Your plan supports a total of ${MAX_SYNC_PAID_USER} Gmail addresses`,
                    MAX_SYNC_PAID_USER
                )}
            </div>
        </Prompt>
    );
};

export default RemoveForwardingModal;
