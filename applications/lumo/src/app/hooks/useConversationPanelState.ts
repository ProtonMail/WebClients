import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useRightPanel } from '../providers/RightPanelProvider';
import type { Attachment, Message } from '../types';

type PanelState = {
    type: 'sources' | 'files' | 'file-preview' | 'html-preview' | null;
    message?: Message;
    filterMessage?: Message;
    autoShowDriveBrowser?: boolean;
    attachment?: Attachment;
    htmlContent?: string;
};

export const useConversationPanelState = () => {
    const { open, close } = useRightPanel();
    const [openPanel, setOpenPanel] = useState<PanelState>({ type: 'files' });

    // TODO: check that this is needed in final version
    const getDrawerTitle = useMemo(() => {
        switch (openPanel.type) {
            case 'sources':
                return () => c('collider_2025:Title').t`Sources`;
            case 'files':
                return () => c('collider_2025:Title').t`Chat knowledge`;
            case 'file-preview':
                return () => c('collider_2025:Title').t`File preview`;
            default:
                return () => c('collider_2025:Title').t`Chat knowledge`;
        }
    }, [openPanel.type]);

    const handleOpenSources = useCallback(
        (message: Message) => {
            if (openPanel.type === 'sources' && openPanel.message === message) {
                setOpenPanel({ type: null });
                close();
            } else {
                setOpenPanel({ type: 'sources', message });
                open();
            }
        },
        [open, close, openPanel.type, openPanel.message]
    );

    const handleOpenFiles = useCallback(
        (message?: Message) => {
            if (message) {
                setOpenPanel({ type: 'files', filterMessage: message });
                open();
            } else if (openPanel.type === 'files' && !openPanel.filterMessage) {
                setOpenPanel({ type: null });
                close();
            } else {
                setOpenPanel({ type: 'files', filterMessage: undefined });
                open();
            }
        },
        [open, close, openPanel.type, openPanel.filterMessage]
    );

    const handleShowDriveBrowser = useCallback(() => {
        setOpenPanel({ type: 'files', filterMessage: undefined, autoShowDriveBrowser: true });
        open();
    }, [open]);

    const handleClosePanel = useCallback(() => {
        setOpenPanel({ type: 'files' });
        close();
    }, [close]);

    const handleOpenFilePreview = useCallback(
        (attachment: Attachment) => {
            setOpenPanel({ type: 'file-preview', attachment });
            open();
        },
        [open]
    );

    const handleOpenHtmlPreview = useCallback((html: string) => {
        setOpenPanel({ type: 'html-preview', htmlContent: html });
    }, []);

    const handleClearFilter = useCallback(() => {
        setOpenPanel((prev) => {
            return prev.type === 'files' ? { type: 'files', filterMessage: undefined } : prev;
        });
    }, []);

    return {
        openPanel,
        getDrawerTitle,
        handleOpenSources,
        handleOpenFiles,
        handleShowDriveBrowser,
        handleClosePanel,
        handleOpenFilePreview,
        handleOpenHtmlPreview,
        handleClearFilter,
    };
};
