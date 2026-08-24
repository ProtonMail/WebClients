import type { FC } from 'react';

import { c } from 'ttag';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import type { SanitizedPasskey } from '../../../lib/passkeys/types';
import { PassModal } from '../../Layout/Modal/PassModal';
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
