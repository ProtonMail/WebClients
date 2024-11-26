import { c } from 'ttag';

import { Icon, Tooltip } from '@proton/components';

import { type SignatureIssues } from '../store';
import { hasValidAnonymousSignature } from './hasValidAnonymousSignature';

interface Props {
    signatureIssues?: SignatureIssues;
    isFile: boolean;
    isAnonymous?: boolean;
    className?: string;
}

export default function SignatureIcon({ isFile, isAnonymous = false, signatureIssues, className }: Props) {
    if (!signatureIssues || (isAnonymous && hasValidAnonymousSignature(signatureIssues))) {
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
