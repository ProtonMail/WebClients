import { c } from 'ttag';

import { Tooltip, Icon } from '@proton/components';

interface Props {
    item: {
        signatureIssues?: any;
        isFile: boolean;
    };
    className?: string;
}

export default function SignatureIcon({ item, className }: Props) {
    if (!item.signatureIssues) {
        return null;
    }

    let title = item.isFile
        ? c('Title').t`This file has a missing or invalid signature. Go to Menu (⋮) → Details for info.`
        : c('Title').t`This folder has a missing or invalid signature. Go to Menu (⋮) → Details for info.`;

    return (
        <Tooltip title={title}>
            <Icon name="lock-exclamation-filled" className={className} />
        </Tooltip>
    );
}
