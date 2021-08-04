import { ReactNode, useEffect, useMemo, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { c } from 'ttag';

import { useLoading, LoaderPage, Icon, usePreventLeave, Bordered, useNotifications } from '@proton/components';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import usePublicSharing from '../../hooks/drive/usePublicSharing';
import FileSaver from '../../utils/FileSaver/FileSaver';
import DownloadSharedInfo from './DownloadSharedInfo';
import EnterPasswordInfo from './EnterPasswordInfo';
import LinkDoesNotExistInfo from './LinkDoesNotExistInfo';
import { InitHandshake, SharedLinkInfo } from '../../interfaces/sharing';
import { useDownloadProvider } from '../downloads/DownloadProvider';
import { STATUS_CODE, BATCH_REQUEST_SIZE } from '../../constants';
import { hasCustomPassword, hasGeneratedPasswordIncluded } from '../../utils/link';

const REPORT_ABUSE_EMAIL = 'abuse@protonmail.com';
const ERROR_CODE_INVALID_SRP_PARAMS = 2026;
const ERROR_CODE_COULD_NOT_IDENTIFY_TARGET = 2000;

const DownloadSharedContainer = () => {
    const { clearDownloads } = useDownloadProvider();
    const [notFoundError, setNotFoundError] = useState<Error | undefined>();
    const [loading, withLoading] = useLoading(false);
    const [handshakeInfo, setHandshakeInfo] = useState<InitHandshake | null>();
    const [linkInfo, setLinkInfo] = useState<(SharedLinkInfo & { Password: string }) | null>();
    const { initSRPHandshake, getSharedLinkPayload, startSharedFileTransfer } = usePublicSharing();
    const { hash, pathname } = useLocation();
    const { preventLeave } = usePreventLeave();
    const { createNotification } = useNotifications();
    const appName = getAppName(APPS.PROTONDRIVE);

    const token = useMemo(() => pathname.replace(/\/urls\/?/, ''), [pathname]);
    const urlPassword = useMemo(() => hash.replace('#', ''), [hash]);
    const [password, setPassword] = useState(urlPassword);

    const initHandshake = useCallback(async () => {
        return initSRPHandshake(token)
            .then((handshakeInfo) => {
                if (hasCustomPassword(handshakeInfo)) {
                    setPassword('');
                }
                setHandshakeInfo(handshakeInfo);
            })
            .catch((e) => {
                console.error(e);
                setNotFoundError(e);
                setHandshakeInfo(null);
            });
    }, [token, password]);

    const getSharedLinkInfo = useCallback(
        async (password: string) => {
            if (!handshakeInfo) {
                return;
            }

            await getSharedLinkPayload(token, password, handshakeInfo, {
                FromBlockIndex: 1,
                PageSize: BATCH_REQUEST_SIZE,
            })
                .then((linkInfo) => {
                    setLinkInfo({ ...linkInfo, Password: password });
                    setHandshakeInfo(null);
                })
                .catch((e) => {
                    console.error(e);
                    const { code, status, message } = getApiError(e);
                    let errorText = message;

                    if (code === ERROR_CODE_INVALID_SRP_PARAMS) {
                        setPassword('');
                        errorText = c('Error').t`Incorrect password. Please try again.`;
                        // SRP session ephemerals are destroyed when you retrieve them.
                        initHandshake().catch(console.error);
                    } else if (code === ERROR_CODE_COULD_NOT_IDENTIFY_TARGET || status === STATUS_CODE.NOT_FOUND) {
                        setNotFoundError(e);
                        errorText = null;
                    }

                    if (errorText) {
                        createNotification({
                            type: 'error',
                            text: errorText,
                        });
                    }
                    setLinkInfo(null);
                });
        },
        [token, password, handshakeInfo]
    );

    const downloadFile = async () => {
        if (!linkInfo) {
            return;
        }

        const { Name, Size, MIMEType, SessionKey, NodeKey, Blocks, Password } = linkInfo;
        const transferMeta = {
            filename: Name,
            size: Size,
            mimeType: MIMEType,
        };

        const fileStream = await startSharedFileTransfer(SessionKey, NodeKey, transferMeta, token, Password, Blocks);
        return preventLeave(FileSaver.saveAsFile(fileStream, transferMeta)).catch(console.error);
    };

    const submitPassword = (customPassword: string) => {
        let password = customPassword;
        if (handshakeInfo && hasGeneratedPasswordIncluded(handshakeInfo)) {
            password = urlPassword + customPassword;
        }
        return getSharedLinkInfo(password).catch(console.error);
    };

    useEffect(() => {
        clearDownloads();
        if (token && !handshakeInfo) {
            setNotFoundError(undefined);
            withLoading(initHandshake()).catch(console.error);
        }
    }, [token, password]);

    useEffect(() => {
        if (token && password && handshakeInfo) {
            withLoading(getSharedLinkInfo(password)).catch(console.error);
        }
    }, [getSharedLinkInfo, token, password, handshakeInfo]);

    if (loading) {
        return <LoaderPage />;
    }

    let content: ReactNode = null;
    if (notFoundError || (!token && !password)) {
        content = <LinkDoesNotExistInfo />;
    } else if (linkInfo) {
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
            <>
                <div className="ui-standard flex flex-column flex-nowrap flex-item-noshrink flex-align-items-center scroll-if-needed h100v">
                    <Bordered className="bg-norm color-norm flex flex-align-items-center flex-item-noshrink w100 max-w40e mbauto mtauto">
                        <div className="flex flex-column flex-nowrap flex-align-items-center text-center p2 w100">
                            <h3>
                                <span className="flex flex-nowrap flex-align-items-center">
                                    <Icon name="protondrive" className="mr0-25" size={20} />
                                    <b>{appName}</b>
                                </span>
                            </h3>
                            {content}
                        </div>
                    </Bordered>
                    <div className="color-weak flex flex-item-noshrink flex-align-items-end on-mobile-pt1">
                        <div className="text-center opacity-50 mb4">
                            <a
                                className="text-sm signup-footer-link"
                                href={`mailto:${REPORT_ABUSE_EMAIL}`}
                                title={c('Label').t`Report abuse`}
                            >
                                {c('Label').t`Report abuse`}
                            </a>
                        </div>
                    </div>
                </div>
            </>
        )
    );
};

export default DownloadSharedContainer;
