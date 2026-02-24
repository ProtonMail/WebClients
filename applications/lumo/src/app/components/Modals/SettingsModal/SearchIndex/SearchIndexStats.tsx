import { Icon } from '@proton/components/index';
import type { FunctionComponent } from 'react';

import { c } from 'ttag';

import type { SearchServiceStatus } from '../../../../services/search/types';

interface Props {
    foundationStatus: SearchServiceStatus | undefined;
    conversationCount: number;
    messageCount: number;
    displayFolders: number;
    displayDriveDocs: number;
    progressColor: (count: number) => string;
    formatBytes: (bytes?: number) => string;
    onInspect: () => void;
    userId?: string;
    enableFoundationSearch: boolean;
}

export const SearchIndexStats: FunctionComponent<Props> = ({
    foundationStatus,
    conversationCount,
    messageCount,
    displayFolders,
    displayDriveDocs,
    progressColor,
    formatBytes,
    onInspect,
    userId,
    enableFoundationSearch,
}) => (
    <div className="flex flex-column gap-1 mt-2">
        <div className="flex justify-space-between">
            <span>{c('Info').t`Advanced search:`}</span>
            <span className="text-semibold">
                {enableFoundationSearch
                    ? foundationStatus?.isEnabled
                        ? c('Status').t`Enabled`
                        : c('Status').t`Disabled`
                    : c('Status').t`Not available`}
            </span>
        </div>

        <div className="flex justify-space-between">
            <span>{c('Info').t`Total conversations:`}</span>
            <span className="text-semibold">{conversationCount}</span>
        </div>
        <div className="flex justify-space-between">
            <span>{c('Info').t`Total messages:`}</span>
            <span className="text-semibold">{messageCount}</span>
        </div>

        <hr className={'mt-3'} />
        <div className="flex justify-space-between">
            <span className="flex items-center gap-2">
                <Icon name={'brand-proton-drive'} size={4} />
                {c('Info').t`Indexed folders:`}
            </span>
            <span className="text-semibold" style={{ color: progressColor(displayFolders) }}>
                {displayFolders}/{displayFolders} ({displayFolders > 0 ? '100%' : '0%'})
            </span>
        </div>
        <div className="flex justify-space-between">
            <span className="flex items-center gap-2">
                <Icon name={'brand-proton-docs'} size={4} />
                {c('Info').t`Indexed files:`}
            </span>
            <span className="text-semibold" style={{ color: progressColor(displayDriveDocs) }}>
                {foundationStatus?.driveDocumentsUnique ?? displayDriveDocs}
            </span>
        </div>
        {foundationStatus?.driveChunks && foundationStatus.driveChunks > 0 && (
            <div className="flex justify-space-between">
                <span className="flex items-center gap-2 pl-6">
                    <Icon name={'squares'} size={4} className="color-weak" />
                    <span className="color-weak">{c('Info').t`Searchable chunks:`}</span>
                </span>
                <span className="text-semibold color-weak">
                    {foundationStatus.driveChunks}
                </span>
            </div>
        )}
        <hr className={'mt-3'} />
        <div className="flex justify-space-between">
            <span>{c('Info').t`Index size:`}</span>
            <span className="text-semibold">{formatBytes(foundationStatus?.totalBytes)}</span>
        </div>
    </div>
);


