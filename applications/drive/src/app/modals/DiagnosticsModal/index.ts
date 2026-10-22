import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';

import { DiagnosticsModalView } from './DiagnosticsModalView';

export const useDiagnosticsModal = () => {
    return useModalTwoStatic(DiagnosticsModalView);
};
