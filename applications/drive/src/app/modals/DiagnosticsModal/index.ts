import { useModalTwoStatic } from '@proton/components';

import { DiagnosticsModalView } from './DiagnosticsModalView';

export const useDiagnosticsModal = () => {
    return useModalTwoStatic(DiagnosticsModalView);
};
