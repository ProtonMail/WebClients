import React, { useRef } from 'react';
import { textToClipboard } from 'proton-shared/lib/helpers/browser';
import {
    Alert,
    Button,
    Checkbox,
    FooterModal,
    HeaderModal,
    InnerModal,
    Label,
    PrimaryButton,
    Row,
    useNotifications,
} from 'react-components';
import { c } from 'ttag';
import DateTime from './DateTime';

interface Props {
    itemName: string;
    password: string;
    expirationTime: number;
    token: string;
    includePassword: boolean;
    customPassword: boolean;
    modalTitleID: string;
    deleting?: boolean;
    onClose?: () => void;
    onEditPasswordClick: () => void;
    onEditExpirationTimeClick: () => void;
    onDeleteLinkClick: () => void;
    onIncludePasswordToggle: () => void;
}

function GeneratedLinkState({
    modalTitleID,
    onClose,
    itemName,
    password,
    expirationTime,
    token,
    customPassword,
    deleting,
    includePassword,
    onEditPasswordClick,
    onEditExpirationTimeClick,
    onDeleteLinkClick,
    onIncludePasswordToggle,
}: Props) {
    const contentRef = useRef<HTMLDivElement>(null);
    const { createNotification } = useNotifications();
    const baseUrl = `${window.location.origin}/urls`;

    const handleClickCopyURL = () => {
        if (contentRef.current) {
            textToClipboard(
                includePassword ? `${baseUrl}/${token}#${password}` : `${baseUrl}/${token}`,
                contentRef.current
            );
            createNotification({ text: c('Success').t`Secure link was copied to the clipboard` });
        }
    };

    const handleCopyPasswordClick = () => {
        if (contentRef.current) {
            textToClipboard(password, contentRef.current);
            createNotification({ text: c('Success').t`Password was copied to the clipboard` });
        }
    };

    const boldNameText = (
        <b key="name" className="break">
            {itemName}
        </b>
    );

    return (
        <>
            <HeaderModal modalTitleID={modalTitleID} onClose={onClose}>
                {c('Title').t`Manage secure link`}
            </HeaderModal>
            <div ref={contentRef} className="pm-modalContent">
                <InnerModal>
                    <Alert>{c('Info').jt`Secure link of "${boldNameText}" has been generated.`}</Alert>

                    <Row>
                        <div className="flex flex-item-fluid">
                            <div
                                className="pm-field w100 mb0-5 pl1 pr1 pt0-5 pb0-5 ellipsis"
                                data-testid="sharing-modal-url"
                            >
                                {baseUrl}/{token}
                                {includePassword && <span className="accented">#{password}</span>}
                            </div>
                        </div>
                        <div className="flex flex-justify-end ml0-5 onmobile-ml0">
                            <div>
                                <PrimaryButton id="copy-url-button" onClick={handleClickCopyURL} className="min-w5e">{c(
                                    'Action'
                                ).t`Copy`}</PrimaryButton>
                            </div>
                        </div>
                    </Row>

                    <Alert>
                        {c('Info').t`A secure password has been generated for you.`}
                        <br />
                        {c('Info').t`Use it to download a file.`}
                    </Alert>
                    <Row>
                        <Label htmlFor="edit-password-button">
                            <span className="mr0-5">{c('Label').t`Password protection`}</span>
                        </Label>
                        <div className="flex flex-column flex-item-fluid">
                            <input
                                readOnly
                                value={password}
                                className="pm-field w100 mb0-5 pl1 pr1 pt0-5 pb0-5 pm-field--accented ellipsis pre"
                                data-testid="sharing-modal-password"
                            />
                            <Checkbox
                                className="mb0-5"
                                disabled={customPassword}
                                checked={includePassword}
                                onChange={onIncludePasswordToggle}
                                data-testid="sharing-modal-includePassword"
                            >{c('Label').t`Include password in the link`}</Checkbox>
                        </div>
                        <div className="flex flex-justify-end ml0-5 onmobile-ml0">
                            <div>
                                <Button id="edit-password-button" onClick={onEditPasswordClick} className="min-w5e">{c(
                                    'Action'
                                ).t`Edit`}</Button>
                            </div>
                            <div>
                                <Button
                                    id="copy-password-button"
                                    onClick={handleCopyPasswordClick}
                                    className="min-w5e ml0-5"
                                >{c('Action').t`Copy`}</Button>
                            </div>
                        </div>
                    </Row>

                    <h3>{c('Title').t`Additional settings`}</h3>

                    <Row>
                        <Label htmlFor="edit-expiration-time-button">
                            <span className="mr0-5">{c('Label').t`Link expires on`}</span>
                        </Label>
                        <div className="flex flex-column flex-item-fluid">
                            <div
                                className="pm-field w100 mb0-5 pl1 pr1 pt0-5 pb0-5 ellipsis"
                                data-testid="sharing-modal-expiration-time"
                            >
                                <DateTime key="expirationTime" value={expirationTime} />
                            </div>
                        </div>
                        <div className="flex flex-justify-end ml0-5 onmobile-ml0">
                            <div>
                                <Button
                                    id="edit-expiration-time-button"
                                    onClick={onEditExpirationTimeClick}
                                    className="min-w5e"
                                >{c('Action').t`Edit`}</Button>
                            </div>
                        </div>
                    </Row>
                </InnerModal>
                <FooterModal>
                    <div className="flex flex-spacebetween w100 flex-nowrap">
                        <Button loading={deleting} onClick={onDeleteLinkClick}>{c('Action')
                            .t`Delete secure link`}</Button>
                        <Button onClick={onClose}>{c('Action').t`Done`}</Button>
                    </div>
                </FooterModal>
            </div>
        </>
    );
}

export default GeneratedLinkState;
