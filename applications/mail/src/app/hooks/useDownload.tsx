import React, { Fragment } from 'react';
import { c } from 'ttag';
import { useCallback } from 'react';
import { useApi, useModals, ConfirmModal, Alert, Href } from 'react-components';

import { Attachment } from '../models/attachment';
import {
    formatDownload,
    generateDownload,
    formatDownloadAll,
    generateDownloadAll
} from '../helpers/attachment/attachmentDownloader';
import { MessageExtended, MessageExtendedWithData } from '../models/message';
import { useAttachmentCache } from '../containers/AttachmentProvider';

const useShowConfirmModal = () => {
    const { createModal } = useModals();

    return useCallback(
        () =>
            new Promise((resolve, reject) => {
                const lineBreak = (
                    <Fragment key={1}>
                        <br />
                        <br />
                    </Fragment>
                );
                const gnuPG = (
                    <Href
                        key={2}
                        href="https://www.gnupg.org/"
                        target="_blank"
                        title={c('Title').t`GnuPG is a free implementation of OpenPGP`}
                    >
                        {c('Title').t`GPG`}
                    </Href>
                );
                createModal(
                    <ConfirmModal
                        onConfirm={resolve}
                        onClose={reject}
                        title={c('Title').t`Error decrypting attachment`}
                        confirm={c('Action').t`Download`}
                    >
                        <Alert type="warning">
                            {c('Error').jt`
                                The attachment will be downloaded but it will still be encrypted.${lineBreak}
                                You can decrypt the file with a program such as ${gnuPG}
                                if you have the corresponding private key.
                            `}
                        </Alert>
                    </ConfirmModal>
                );
            }),
        []
    );
};

export const useDownload = () => {
    const api = useApi();
    const cache = useAttachmentCache();
    const showConfirmModal = useShowConfirmModal();

    return useCallback(
        async (message: MessageExtended, attachment: Attachment) => {
            const download = await formatDownload(attachment, message, cache, api);

            if (download.isError) {
                await showConfirmModal();
            }

            await generateDownload(download);
        },
        [api, cache]
    );
};

export const useDownloadAll = () => {
    const api = useApi();
    const cache = useAttachmentCache();
    const showConfirmModal = useShowConfirmModal();

    return useCallback(
        async (message: MessageExtendedWithData) => {
            const list = await formatDownloadAll(message, cache, api);
            const isError = list.some(({ isError }) => isError);

            if (isError) {
                await showConfirmModal();
            }

            await generateDownloadAll(message, list);
        },
        [api, cache]
    );
};
