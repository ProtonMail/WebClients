import { useUser } from '@proton/account/user/hooks';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import { hasPaidMail, hasPaidVpn } from '@proton/shared/lib/user/helpers';

import DowngradeModal from '../../DowngradeModal';
import type { CancellationStep, CancellationStepConfig } from './types';

export const useDowngradeStep = ({ canShow }: CancellationStepConfig): CancellationStep => {
    const [user] = useUser();
    const [downgradeModal, showDowngradeModal] = useModalTwoPromise<{ hasMail: boolean; hasVpn: boolean }>();

    const modal = downgradeModal(({ onResolve, onReject, ...props }) => {
        return <DowngradeModal {...props} onConfirm={onResolve} onClose={onReject} />;
    });

    const show = async () => {
        if (!(await canShow())) {
            return;
        }

        const hasMail = hasPaidMail(user);
        const hasVpn = hasPaidVpn(user);

        await showDowngradeModal({ hasMail, hasVpn });
    };

    return { modal, show };
};
