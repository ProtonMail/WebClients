import { c } from 'ttag';

import { Icon, Tooltip } from '@proton/components';

interface Props {
    signatureIssues?: any;
    isFile: boolean;
    className?: string;
}

export default function SignatureIcon({ isFile, signatureIssues, className }: Props) {
    if (!signatureIssues) {
        return null;
    }

    let title = isFile
        ? c('Title').t`This file has a missing or invalid signature. Go to Menu (⋮) → Details for info.`
        : c('Title').t`This folder has a missing or invalid signature. Go to Menu (⋮) → Details for info.`;

    return (
        <Tooltip title={title}>
            <Icon name="lock-exclamation-filled" className={className} />
        </Tooltip>
    );
}
