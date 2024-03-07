import type { FC } from 'react';

import { type ModalProps, ModalTwo } from '@proton/components';

export const PassModal: FC<ModalProps> = ({ children, ...modalProps }) => (
    <ModalTwo {...modalProps}>{children}</ModalTwo>
);
