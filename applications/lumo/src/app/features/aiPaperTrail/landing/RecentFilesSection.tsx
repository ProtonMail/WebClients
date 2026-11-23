import { useEffect, useState } from 'react';

import { c } from 'ttag';

import chatgptLogo from '@proton/styles/assets/img/lumo/trail/chatgpt.svg';
import claudeLogo from '@proton/styles/assets/img/lumo/trail/claude.svg';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { type RecentPaperTrailFile, getRecentPaperTrailFiles } from '../../../util/paperTrailRecentStorage';
import { getPaperTrailReportIds } from '../../../util/paperTrailReportStorage';

interface Props {
    refreshKey: number;
    onOpenReport: (id: string) => void;
    onDeleteReport: (id: string) => void;
}

const formatRecentDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const getRecentImportLabel = (source: RecentPaperTrailFile['source']): string => {
    if (source === 'claude') {
        return c('collider_2025:Title').t`Claude import`;
    }
    return c('collider_2025:Title').t`ChatGPT import`;
};

const getRecentImportLogo = (source: RecentPaperTrailFile['source']): string => {
    if (source === 'claude') {
        return claudeLogo;
    }
    return chatgptLogo;
};

export const RecentFilesSection = ({ refreshKey, onOpenReport, onDeleteReport }: Props) => {
    const [recentFiles, setRecentFiles] = useState<RecentPaperTrailFile[]>([]);
    const [openableFileIds, setOpenableFileIds] = useState<Set<string>>(() => {
        return new Set();
    });

    useEffect(() => {
        setRecentFiles(getRecentPaperTrailFiles());
        setOpenableFileIds(new Set(getPaperTrailReportIds()));
    }, [refreshKey]);

    const openableFiles = recentFiles.filter((file) => {
        return openableFileIds.has(file.id);
    });

    if (openableFiles.length === 0) {
        return null;
    }

    return (
        <section className="ai-paper-trail__landing-recent ai-paper-trail__recent mt-2">
            <div className="ai-paper-trail__recent-head mb-3 px-1">
                <h2 className="ai-paper-trail__recent-title m-0 lumo-title-medium">{c('collider_2025:Title')
                    .t`Your recent reports`}</h2>
            </div>
            <ul className="ai-paper-trail__recent-list m-0 p-0 radius-12">
                {openableFiles.map((file) => {
                    return (
                        <li key={file.id} className="ai-paper-trail__recent-item">
                            <button
                                type="button"
                                className="ai-paper-trail__recent-button gap-3 pl-4 pr-3"
                                onClick={() => {
                                    onOpenReport(file.id);
                                }}
                            >
                                <img
                                    src={getRecentImportLogo(file.source)}
                                    alt=""
                                    className="ai-paper-trail__recent-logo shrink-0"
                                />
                                <span className="ai-paper-trail__recent-name lumo-body-medium">
                                    {getRecentImportLabel(file.source)}
                                </span>
                                <span className="ai-paper-trail__recent-date lumo-body-small">
                                    {formatRecentDate(file.uploadedAt)}
                                </span>
                            </button>
                            <button
                                type="button"
                                className="ai-paper-trail__recent-delete p-0"
                                aria-label={c('collider_2025:Action').t`Delete analysis`}
                                onClick={() => {
                                    onDeleteReport(file.id);
                                }}
                            >
                                <LumoIcon name="Trash" size={16} />
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};
