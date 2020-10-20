import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { c } from 'ttag';

import { useLocation } from 'react-router-dom';
import { useLoading, LoaderPage, Icon } from 'react-components';

import usePublicSharing from '../hooks/drive/usePublicSharing';
import FileSaver from '../utils/FileSaver/FileSaver';
import DownloadSharedForm from '../components/DownloadSharedForm';
import { SharedLinkInfo } from '../interfaces/sharing';

const DownloadSharedContainer = () => {
    const [loading, withLoading] = useLoading(true);
    const [linkInfo, setLinkInfo] = useState<SharedLinkInfo | null>();
    const { getSharedLinkPayload, startSharedFileTransfer } = usePublicSharing();
    const { hash, pathname } = useLocation();

    const token = useMemo(() => pathname.replace('/urls/', ''), [pathname]);
    const password = useMemo(() => hash.replace('#', ''), [hash]);

    const getSharedLinkInfo = useCallback(async () => {
        setLinkInfo(await getSharedLinkPayload(token, password));
    }, [token, password]);

    const downloadFile = async () => {
        if (!linkInfo) {
            return;
        }

        const { Name, Size, MIMEType, SessionKey, NodeKey, Blocks } = linkInfo;
        const transferMeta = {
            filename: Name,
            size: Size,
            mimeType: MIMEType,
        };
        const fileStream = await startSharedFileTransfer(Blocks, SessionKey, NodeKey, transferMeta);
        return FileSaver.saveAsFile(fileStream, transferMeta);
    };

    useEffect(() => {
        withLoading(getSharedLinkInfo()).catch(console.error);
    }, [getSharedLinkInfo]);

    if (loading) {
        return <LoaderPage />;
    }

    return (
        <>
            {linkInfo && (
                <div className="flex flex-column flex-nowrap flex-item-noshrink flex-items-center scroll-if-needed h100v">
                    <DownloadSharedForm
                        className="mtauto mbauto"
                        name={linkInfo.Name}
                        size={linkInfo.Size}
                        expirationTime={linkInfo.ExpirationTime}
                        downloadFile={downloadFile}
                    />
                    <div className="color-global-light flex flex-item-noshrink flex-items-end onmobile-pt1">
                        <div className="aligncenter opacity-50 mb2">
                            <Icon name="lock-check" size={20} />
                            <div className="small m0">{c('Label').t`Zero-Access Encryption by Proton`}</div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DownloadSharedContainer;
