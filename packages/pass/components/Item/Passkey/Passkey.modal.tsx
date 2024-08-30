import type { FC } from 'react';

import { c } from 'ttag';

import { type ModalProps, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';

import { PasskeyContent } from './Passkey.content';

type Props = ModalProps & { passkey: SanitizedPasskey };

export const PasskeyContentModal: FC<Props> = ({ passkey, ...modalProps }) => (
    <PassModal {...modalProps} enableCloseWhenClickOutside>
        <ModalTwoHeader title={c('Title').t`Passkey`} closeButtonProps={{ pill: true }} />
        <ModalTwoContent className="pt-2 pb-5">
            <PasskeyContent passkey={passkey} />
        </ModalTwoContent>
    </PassModal>
);
