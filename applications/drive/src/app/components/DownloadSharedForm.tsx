import React, { useState } from 'react';
import { c } from 'ttag';

import readableTime from 'proton-shared/lib/helpers/readableTime';
import { dateLocale } from 'proton-shared/lib/i18n';
import { LargeButton, Icon, useLoading, Alert, Bordered, classnames } from 'react-components';

import SizeCell from './FileBrowser/ListView/Cells/SizeCell';
import NameCell from './FileBrowser/ListView/Cells/NameCell';

interface Props {
    name: string;
    size: number;
    expirationTime: number;
    downloadFile: () => Promise<void>;
    className?: string;
}

function DownloadSharedForm({ name, size, expirationTime, downloadFile, className = '' }: Props) {
    const [error, setError] = useState(false);
    const [loading, withLoading] = useLoading();
    const expiresOnMessage = c('Info').t`Secure link expires on`;
    const expirationDate = readableTime(expirationTime, 'PP', { locale: dateLocale });

    const onDownload = () => {
        withLoading(downloadFile()).catch((err) => {
            console.error(err);
            setError(true);
        });
    };

    return (
        <Bordered
            style={{ minHeight: '30em' }}
            className={classnames(['bg-white-dm color-global-grey-dm flex-items-center flex w100 mw40e', className])}
        >
            {error ? (
                <Alert type="error">{c('Info').t`Failed to initiate link download. Try again later.`}</Alert>
            ) : (
                <div className="flex flex-column flex-items-center aligncenter p2 w100">
                    <h3>
                        <span className="flex flex-items-center">
                            <Icon name="protondrive" className="mr0-25" size={20} />
                            <b>ProtonDrive</b>
                        </span>
                    </h3>
                    <h3 className="bold mt2 mb0-25">{c('Title').t`Your file is ready to be download`}</h3>
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
        </Bordered>
    );
}

export default DownloadSharedForm;
