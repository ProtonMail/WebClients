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
                <div style={{ height: '100vh' }} className="flex flex-column flex-items-center">
                    <DownloadSharedForm
                        className="mtauto mbauto"
                        name={linkInfo.Name}
                        size={linkInfo.Size}
                        expirationTime={linkInfo.ExpirationTime}
                        downloadFile={downloadFile}
                    />
                    <div className="color-global-light flex flex-items-end">
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
