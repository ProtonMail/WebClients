import React, { useState } from 'react';
import { c } from 'ttag';

import { dateLocale } from 'proton-shared/lib/i18n';
import { noop } from 'proton-shared/lib/helpers/function';
import readableTime from 'proton-shared/lib/helpers/readableTime';
import {
    DialogModal,
    HeaderModal,
    InnerModal,
    LargeButton,
    Icon,
    useLoading,
    Alert,
    usePreventLeave,
} from 'react-components';

import SizeCell from './FileBrowser/ListView/Cells/SizeCell';
import NameCell from './FileBrowser/ListView/Cells/NameCell';

interface Props {
    name: string;
    size: number;
    expirationTime: number;
    downloadFile: () => Promise<void>;
    onClose?: () => void;
}

function DownloadSharedModal({ name, size, expirationTime, downloadFile, onClose, ...rest }: Props) {
    const modalTitleID = 'downloadSharedModal';
    const [error, setError] = useState(false);
    const [loading, withLoading] = useLoading();
    const { preventLeave } = usePreventLeave();
    const expiresOnMessage = c('Info').t`Secure link expires on`;
    const expirationDate = readableTime(expirationTime, 'PP', { locale: dateLocale });

    const onDownload = () => {
        return preventLeave(
            withLoading(downloadFile()).catch((err) => {
                console.error(err);
                setError(true);
            })
        );
    };

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} hasClose={false} onClose={noop}>
                <h3 className="flex flex-column flex-items-center">
                    <span className="flex flex-items-center">
                        <Icon name="protondrive" className="mr0-25" size={20} />
                        <b>ProtonDrive</b>
                    </span>
                </h3>
            </HeaderModal>
            <div className="pm-modalContent">
                <InnerModal>
                    {error ? (
                        <Alert type="error">{c('Info').t`Failed to initiate link download. Try again later.`}</Alert>
                    ) : (
                        <div className="flex flex-column flex-items-center aligncenter mb2 w100">
                            <h2 className="bold mb0">{c('Title').t`Your file is ready to download`}</h2>
                            <p className="m0">
                                {expiresOnMessage}
                                <span className="ml0-25 no-wrap">{expirationDate}</span>
                            </p>
                            <div className="mt2 mb2 flex flex-column w200p">
                                <LargeButton
                                    className="pm-button--primary ml2 mr2 mt1 mb1"
                                    onClick={onDownload}
                                    loading={loading}
                                >
                                    {c('Action').t`Download`}
                                </LargeButton>
                            </div>
                            <h4 className="bold mb0-25 w100">
                                <NameCell name={name} />
                            </h4>
                            <SizeCell size={size} />
                        </div>
                    )}
                </InnerModal>
            </div>
        </DialogModal>
    );
}

export default DownloadSharedModal;
