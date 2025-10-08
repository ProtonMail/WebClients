import type { FC } from 'react';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';

export const PassModal: FC<ModalProps> = ({ children, ...modalProps }) => (
    <ModalTwo {...modalProps}>{children}</ModalTwo>
);
