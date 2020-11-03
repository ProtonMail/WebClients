import React, { ReactNode, useEffect, useMemo, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { c } from 'ttag';

import {
    useLoading,
    LoaderPage,
    Icon,
    usePreventLeave,
    Bordered,
    StandardLoadError,
    useNotifications,
} from 'react-components';
import { getApiError } from 'proton-shared/lib/api/helpers/apiErrorHelper';

import usePublicSharing from '../../hooks/drive/usePublicSharing';
import FileSaver from '../../utils/FileSaver/FileSaver';
import DownloadSharedInfo from './DownloadSharedInfo';
import EnterPasswordInfo from './EnterPasswordInfo';
import { InitHandshake, SharedLinkInfo } from '../../interfaces/sharing';

const ERROR_CODE_INVALID_SRP_PARAMS = 2026;
const ERROR_MESSAGE_INCORRECT_PASSWORD = c('Error').t`Incorrect password. Please try again.`;
const ERROR_MESSAGE_LINK_DOESN_NOT_EXIST = c('Error').t`The link either does not exist or has expired.`;

const DownloadSharedContainer = () => {
    const [error, setError] = useState<Error | undefined>();
    const [loading, withLoading] = useLoading(false);
    const [handshakeInfo, setHandshekeInfo] = useState<InitHandshake | null>();
    const [linkInfo, setLinkInfo] = useState<SharedLinkInfo | null>();
    const { initSRPHandshake, getSharedLinkPayload, startSharedFileTransfer } = usePublicSharing();
    const { hash, pathname } = useLocation();
    const { preventLeave } = usePreventLeave();
    const { createNotification } = useNotifications();

    const token = useMemo(() => pathname.replace(/\/urls\/?/, ''), [pathname]);
    const password = useMemo(() => hash.replace('#', ''), [hash]);

    const initHandshake = useCallback(async () => {
        return initSRPHandshake(token)
            .then(setHandshekeInfo)
            .catch((e) => {
                setError(e);
                setHandshekeInfo(null);
            });
    }, [token]);

    const getSharedLinkInfo = useCallback(
        async (password: string, passSubmittedManually = false) => {
            if (!handshakeInfo) {
                return;
            }

            await getSharedLinkPayload(token, password, handshakeInfo)
                .then(setLinkInfo)
                .catch((e) => {
                    const { code, message } = getApiError(e);
                    let text = message;

                    if (code === ERROR_CODE_INVALID_SRP_PARAMS) {
                        text = ERROR_MESSAGE_LINK_DOESN_NOT_EXIST;

                        if (passSubmittedManually) {
                            text = ERROR_MESSAGE_INCORRECT_PASSWORD;

                            // SRP session ephemerals are destroyed when you retrieve them.
                            initHandshake().catch(console.error);
                        }
                    }

                    createNotification({
                        type: 'error',
                        text,
                    });

                    setLinkInfo(null);
                });
        },
        [token, password, handshakeInfo]
    );

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
        return preventLeave(FileSaver.saveAsFile(fileStream, transferMeta)).catch(console.error);
    };

    const submitPassword = (pass: string) => {
        return getSharedLinkInfo(pass, true).catch(console.error);
    };

    useEffect(() => {
        if (token) {
            withLoading(initHandshake()).catch(console.error);
        }
    }, [token]);

    useEffect(() => {
        if (token && password && handshakeInfo) {
            withLoading(getSharedLinkInfo(password)).catch(console.error);
        }
    }, [getSharedLinkInfo, token, password, handshakeInfo]);

    if (!token && !password) {
        return null;
    }
    if (error) {
        return <StandardLoadError />;
    }
    if (loading) {
        return <LoaderPage />;
    }

    let content: ReactNode = null;
    if (linkInfo) {
        content = (
            <DownloadSharedInfo
                name={linkInfo.Name}
                size={linkInfo.Size}
                expirationTime={linkInfo.ExpirationTime}
                downloadFile={downloadFile}
            />
        );
    } else if (handshakeInfo && !password) {
        content = <EnterPasswordInfo submitPassword={submitPassword} />;
    }

    return (
        content && (
            <div className="flex flex-column flex-nowrap flex-item-noshrink flex-items-center scroll-if-needed h100v">
                <Bordered className="bg-white-dm color-global-grey-dm flex flex-items-center flex-item-noshrink w100 mw40e mbauto mtauto">
                    <div className="flex flex-column flex-nowrap flex-items-center aligncenter p2 w100">
                        <h3>
                            <span className="flex flex-nowrap flex-items-center">
                                <Icon name="protondrive" className="mr0-25" size={20} />
                                <b>ProtonDrive</b>
                            </span>
                        </h3>
                        {content}
                    </div>
                </Bordered>
                <div className="color-global-light flex flex-item-noshrink flex-items-end onmobile-pt1">
                    <div className="aligncenter opacity-50 mb2">
                        <Icon name="lock-check" size={20} />
                        <div className="small m0">{c('Label').t`Zero-Access Encryption by Proton`}</div>
                    </div>
                </div>
            </div>
        )
    );
};

export default DownloadSharedContainer;
