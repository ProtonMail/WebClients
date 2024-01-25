import type { FC } from 'react';

import { type ModalProps, ModalTwo } from '@proton/components';
import { useBulkLock } from '@proton/pass/hooks/useBulkLock';

export const PassModal: FC<ModalProps> = ({ children, ...modalProps }) => {
    useBulkLock([modalProps.open ?? false]);
    return <ModalTwo {...modalProps}>{children}</ModalTwo>;
};
