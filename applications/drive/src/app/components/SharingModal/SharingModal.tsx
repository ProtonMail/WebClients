import { textToClipboard } from 'proton-shared/lib/helpers/browser';
import { getRandomString } from 'proton-shared/lib/helpers/string';
import React, { useEffect, useState, useCallback } from 'react';
import {
    DialogModal,
    HeaderModal,
    InnerModal,
    FooterModal,
    Button,
    Alert,
    Row,
    Label,
    Checkbox,
    useLoading,
    Loader,
    TextLoader,
    PrimaryButton,
    useNotifications,
} from 'react-components';
import { c } from 'ttag';
import useDrive from '../../hooks/drive/useDrive';
import useSharing from '../../hooks/drive/useSharing';
import { FileBrowserItem } from '../FileBrowser/interfaces';

const SHARING_BASE_URL = 'https://drive.proton.me/urls';

interface Props {
    onClose?: () => void;
    modalTitleID?: string;
    item: FileBrowserItem;
    shareId: string;
}

function SharingModal({ modalTitleID = 'onboardingModal', onClose, item, shareId, ...rest }: Props) {
    const [password, setPassword] = useState(() => getRandomString(10));
    const [token, setToken] = useState<string>();
    const [includePassword, setIncludePassword] = useState(true);
    const [error, setError] = useState(false);
    const [loading, withLoading] = useLoading(true);
    const { getShareMetaShort } = useDrive();
    const { createSharedLink, getSharedURLs } = useSharing();
    const { createNotification } = useNotifications();

    const getToken = useCallback(async () => {
        const { Token } = item.SharedURLShareID
            ? await getSharedURLs(item.SharedURLShareID).then(([ShareURL]) => {
                  setPassword(ShareURL.Password);
                  return ShareURL;
              })
            : await getShareMetaShort(shareId)
                  .then(({ VolumeID }) => createSharedLink(shareId, VolumeID, item.LinkID, password))
                  .then(({ ShareURL }) => ShareURL);
        setToken(Token);
    }, [shareId, item.LinkID, item.SharedURLShareID, password]);

    useEffect(() => {
        withLoading(getToken()).catch((err) => {
            console.error(err);
            setError(true);
        });
    }, [getToken]);

    const handleClickCopyURL = () => {
        textToClipboard(includePassword ? `${SHARING_BASE_URL}/${token}#${password}` : `${SHARING_BASE_URL}/${token}`);
        createNotification({ text: c('Success').t`Secure link was copied to the clipboard` });
    };

    const handleClickCopyPassword = () => {
        textToClipboard(password);
        createNotification({ text: c('Success').t`Password was copied to the clipboard` });
    };

    const handleChangeIncludePassword = () => {
        setIncludePassword((includePassword) => !includePassword);
    };

    const boldNameText = <b>{item.Name}</b>;

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} onClose={onClose} hasClose={!loading}>
                {!loading && c('Title').t`Get secure link`}
            </HeaderModal>
            <div className="pm-modalContent">
                <InnerModal>
                    {error && (
                        <Alert type="error">{c('Info').t`Failed to generate a secure link. Try again later.`}</Alert>
                    )}
                    {loading ? (
                        <div className="flex flex-column flex-items-center">
                            <Loader size="medium" className="mt1 mb1" />
                            <TextLoader className="m0">{c('Info').t`Generating secure link`}</TextLoader>
                        </div>
                    ) : (
                        !error && (
                            <>
                                <Alert>{c('Info').jt`Secure link of "${boldNameText}" has been generated.`}</Alert>

                                <Row>
                                    <div className="flex flex-item-fluid">
                                        <div className="pm-field w100 mb0-5 pl1 pr1 pt0-5 pb0-5 ellipsis">
                                            {SHARING_BASE_URL}/{token}
                                            {includePassword && <span className="accented">#{password}</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <PrimaryButton onClick={handleClickCopyURL} className="min-w5e ml0-5">{c(
                                            'Action'
                                        ).t`Copy`}</PrimaryButton>
                                    </div>
                                </Row>

                                <Alert>
                                    {c('Info').t`A secure password has been generated for you.`}
                                    <br />
                                    {c('Info').t`Use it in order to decrypt a file after downloading it.`}
                                </Alert>
                                <Row>
                                    <Label htmlFor="edit-password">
                                        <span className="mr0-5">{c('Label').t`Password protection`}</span>
                                    </Label>
                                    <div className="flex flex-column flex-item-fluid">
                                        <div className="pm-field w100 mb0-5 pl1 pr1 pt0-5 pb0-5 pm-field--accented ellipsis">
                                            {password}
                                        </div>
                                        <Checkbox checked={includePassword} onChange={handleChangeIncludePassword}>{c(
                                            'Label'
                                        ).t`Include password in the link`}</Checkbox>
                                    </div>
                                    <div>
                                        <Button onClick={handleClickCopyPassword} className="min-w5e ml0-5">{c('Action')
                                            .t`Copy`}</Button>
                                    </div>
                                </Row>
                            </>
                        )
                    )}
                </InnerModal>
                <FooterModal>{!loading && <Button onClick={onClose}>{c('Action').t`Done`}</Button>}</FooterModal>
            </div>
        </DialogModal>
    );
}

export default SharingModal;
