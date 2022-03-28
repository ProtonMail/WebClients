import { c } from 'ttag';

import { Tooltip, Icon } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

export default function SignatureIcon({ item, className }: { item: FileBrowserItem; className?: string }) {
    if (!item.SignatureIssues) {
        return null;
    }

    let title = item.IsFile
        ? c('Title').t`This file has a missing or invalid signature. Go to Menu (⋮) → Details for info.`
        : c('Title').t`This folder has a missing or invalid signature. Go to Menu (⋮) → Details for info.`;

    return (
        <Tooltip title={title}>
            <Icon name="lock-triangle-exclamation-filled" className={className} />
        </Tooltip>
    );
}
