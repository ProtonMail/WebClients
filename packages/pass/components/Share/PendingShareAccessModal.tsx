import { type FC } from 'react';

import { c } from 'ttag';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import accountImg from '@proton/pass/assets/protonpass-account.svg';
import { AdaptiveModal } from '@proton/pass/components/Layout/Modal/AdaptiveModal';

export type Props = Omit<ModalProps, 'onSubmit'>;

export const PendingShareAccessModal: FC<Props> = ({ ...props }) => (
    <AdaptiveModal {...props} size="small">
        <div className="flex flex-column items-center justify-center gap-6">
            <h3 className="text-bold w-3/4">{c('Title').t`Pending access to the shared data`}</h3>

            <img
                src={accountImg}
                alt="pending share access graphic"
                className="w-3/5 max-w-custom"
                style={{ '--max-w-custom': '15em' }}
            />

            <div className="text-md w-3/4">{c('Info').t`For security reasons, your access needs to be confirmed`}</div>
        </div>
    </AdaptiveModal>
);
