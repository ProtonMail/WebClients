import { format } from 'date-fns';
import { c } from 'ttag';

import type { NodeEntity } from '@proton/drive';
import { getNodeName } from '@proton/drive/modules/nodes';
import { dateLocale } from '@proton/shared/lib/i18n';

export function formatDownloadArchiveFilename(nodes: NodeEntity[]): string {
    if (nodes.length === 1) {
        return `${getNodeName(nodes[0])}.zip`;
    }
    const timestamp = format(new Date(), 'yyyy-MM-dd', { locale: dateLocale });
    return `Proton Drive Download - ${timestamp}.zip`;
}

export function formatAlbumArchiveFilename(albumName: string): string {
    return `${albumName.trim() || c('Info').t`Album`}.zip`;
}
