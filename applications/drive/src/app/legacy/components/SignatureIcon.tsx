import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcLockExclamationFilled } from '@proton/icons/icons/IcLockExclamationFilled';

interface SimpleSignatureIconProps {
    haveSignatureIssues: boolean;
    isFile: boolean;
    className?: string;
}

export function SignatureIcon({ haveSignatureIssues, isFile, className }: SimpleSignatureIconProps) {
    if (!haveSignatureIssues) {
        return null;
    }

    const title = isFile
        ? c('Title').t`This file has a missing or invalid signature. Go to Menu (⋮) → Details for info.`
        : c('Title').t`This folder has a missing or invalid signature. Go to Menu (⋮) → Details for info.`;

    return (
        <Tooltip title={title}>
            <IcLockExclamationFilled className={className} />
        </Tooltip>
    );
}
