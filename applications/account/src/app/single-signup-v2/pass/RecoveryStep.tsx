import { isIos, isIpad } from '@proton/shared/lib/helpers/browser';

import CopyRecoveryStep from './CopyRecoveryStep';
import type { PDFRecoveryProps } from './PDFRecoveryStep';
import PDFRecoveryStep from './PDFRecoveryStep';

const RecoveryStep = (props: PDFRecoveryProps) => {
    const isBrokenBlobDownload = isIos() || isIpad();
    if (isBrokenBlobDownload) {
        return <CopyRecoveryStep {...props} />;
    }
    return <PDFRecoveryStep {...props} />;
};

export default RecoveryStep;
