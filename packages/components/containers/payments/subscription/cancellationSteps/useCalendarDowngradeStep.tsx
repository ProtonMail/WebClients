import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';

import CalendarDowngradeModal from '../CalendarDowngradeModal';
import type { CancellationStep, CancellationStepConfig } from './types';

export const useCalendarDowngradeStep = ({ canShow }: CancellationStepConfig): CancellationStep => {
    const [calendarDowngradeModal, showCalendarDowngradeModal] = useModalTwoPromise();

    const modal = calendarDowngradeModal(({ onResolve, onReject, ...props }) => {
        return <CalendarDowngradeModal isDowngrade {...props} onConfirm={onResolve} onClose={onReject} />;
    });

    const show = async () => {
        if (!(await canShow())) {
            return;
        }

        await showCalendarDowngradeModal();
    };

    return { modal, show };
};
