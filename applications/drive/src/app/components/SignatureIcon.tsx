import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import { Icon } from '@proton/components';

import { type SignatureIssues } from '../store';
import { hasValidAnonymousSignature } from './hasValidAnonymousSignature';

interface Props {
    signatureIssues?: SignatureIssues;
    isFile: boolean;
    mimeType?: string;
    isAnonymous?: boolean;
    className?: string;
    haveParentAccess: boolean;
}

export default function SignatureIcon({
    isFile,
    mimeType,
    isAnonymous = false,
    signatureIssues,
    className,
    haveParentAccess,
}: Props) {
    if (
        !signatureIssues ||
        (isAnonymous && hasValidAnonymousSignature(signatureIssues, { mimeType, isFile, haveParentAccess }))
    ) {
        return null;
    }

    const title = isFile
        ? c('Title').t`This file has a missing or invalid signature. Go to Menu (⋮) → Details for info.`
        : c('Title').t`This folder has a missing or invalid signature. Go to Menu (⋮) → Details for info.`;

    return (
        <Tooltip title={title}>
            <Icon name="lock-exclamation-filled" className={className} />
        </Tooltip>
    );
}
