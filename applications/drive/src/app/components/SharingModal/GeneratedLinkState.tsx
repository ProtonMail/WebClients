import React, { useRef, useState } from 'react';
import { c } from 'ttag';
import { getUnixTime } from 'date-fns';
import { textToClipboard } from 'proton-shared/lib/helpers/browser';
import {
    Alert,
    Button,
    classnames,
    ContentModal,
    FooterModal,
    HeaderModal,
    Icon,
    InnerModal,
    Input,
    Label,
    PrimaryButton,
    ResetButton,
    Row,
    Toggle,
    useNotifications,
} from 'react-components';

import ExpirationTimeDatePicker from './ExpirationTimeDatePicker';
import useConfirm from '../../hooks/util/useConfirm';

interface Props {
    itemName: string;
    initialPassword: string;
    initialExpiration: number | null;
    token: string;
    passwordToggledOn: boolean;
    expirationToggledOn: boolean;
    customPassword: boolean;
    modalTitleID: string;
    deleting?: boolean;
    saving?: boolean;
    onClose?: () => void;
    onSaveLinkClick: (password?: string, duration?: number | null) => Promise<void>;
    onDeleteLinkClick: () => void;
    onIncludePasswordToggle: () => void;
    onIncludeExpirationTimeToogle: () => void;
}

function GeneratedLinkState({
    modalTitleID,
    onClose,
    itemName,
    initialPassword,
    initialExpiration,
    token,
    customPassword,
    deleting,
    saving,
    passwordToggledOn,
    expirationToggledOn,
    onSaveLinkClick,
    onDeleteLinkClick,
    onIncludePasswordToggle,
    onIncludeExpirationTimeToogle,
}: Props) {
    const contentRef = useRef<HTMLDivElement>(null);
    const { createNotification } = useNotifications();
    const { openConfirmModal } = useConfirm();
    const baseUrl = `${window.location.origin}/urls`;

    const [password, setPassword] = useState(initialPassword);
    const [expiration, setExpiration] = useState(initialExpiration);
    const [additionalSettingsExpanded, setAdditionalSettingsExpanded] = useState(customPassword || !!initialExpiration);

    const isFormDirty =
        (expiration !== initialExpiration && expirationToggledOn) ||
        (initialExpiration && !expirationToggledOn) ||
        (password !== initialPassword && passwordToggledOn);

    const isSaveDisabled = !isFormDirty || (passwordToggledOn && !password) || (expirationToggledOn && !expiration);

    const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleCopyURLClick = () => {
        if (contentRef.current) {
            textToClipboard(
                !passwordToggledOn ? `${baseUrl}/${token}#${initialPassword}` : `${baseUrl}/${token}`,
                contentRef.current
            );
            createNotification({ text: c('Success').t`The link to your file was successfully copied.` });
        }
    };

    const handleCopyPasswordClick = () => {
        if (contentRef.current && password) {
            textToClipboard(password, contentRef.current);
            createNotification({ text: c('Success').t`The password to access your file was copied.` });
        }
    };

    const handleSubmit = async () => {
        const newPassword = password !== initialPassword ? password : undefined;
        let newDuration: number | null | undefined = null;
        if (expirationToggledOn) {
            newDuration =
                expiration && expiration !== initialExpiration ? expiration - getUnixTime(Date.now()) : undefined;
        }

        await onSaveLinkClick(newPassword, newDuration);
    };

    const handleClose = () => {
        if (isFormDirty) {
            openConfirmModal({
                title: c('Title').t`Discard changes?`,
                confirm: c('Title').t`Discard`,
                message: c('Info').t`You will lose all unsaved changes.`,
                onConfirm: () => onClose?.(),
                canUndo: true,
            });
        } else {
            onClose?.();
        }
    };

    const boldNameText = (
        <b key="name" className="text-break">
            {`"${itemName}"`}
        </b>
    );

    const url = `${baseUrl}/${token}${!passwordToggledOn ? `#${initialPassword}` : ''}`;

    return (
        <>
            <HeaderModal modalTitleID={modalTitleID} onClose={handleClose}>
                {c('Title').t`Share with link`}
            </HeaderModal>
            <ContentModal
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
                onReset={(e) => {
                    e.preventDefault();
                    handleClose();
                }}
            >
                <InnerModal>
                    <div ref={contentRef}>
                        <Alert>
                            {c('Info').jt`Anyone with this link can download the file ${boldNameText}.`}
                            <br />
                            {c('Info').t`Protect the link with a password.`}
                        </Alert>
                        <Row className="on-mobile-mb0-5">
                            <div className="flex flex-item-fluid on-mobile-mb0-5">
                                <Input
                                    readOnly
                                    value={url}
                                    className="no-scroll text-ellipsis"
                                    data-testid="sharing-modal-url"
                                />
                            </div>
                            <div className="flex-no-min-children flex-justify-end ml0-5 on-mobile-ml0">
                                <PrimaryButton id="copy-url-button" onClick={handleCopyURLClick} className="min-w7e">{c(
                                    'Action'
                                ).t`Copy`}</PrimaryButton>
                            </div>
                        </Row>
                        <div className="flex flex-justify-space-between w100 flex-nowrap mt2 mb1 pr1">
                            <h3>{c('Title').t`Additional settings`}</h3>
                            <Icon
                                className={classnames([
                                    'cursor-pointer ',
                                    additionalSettingsExpanded ? 'rotateX-180' : undefined,
                                ])}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.currentTarget.blur();

                                    setAdditionalSettingsExpanded(!additionalSettingsExpanded);
                                }}
                                size={20}
                                name="caret"
                            />
                        </div>
                        {additionalSettingsExpanded && (
                            <>
                                <div className="flex-no-min-children flex-nowrap mb1 on-mobile-flex-column on-mobile-mb0-5">
                                    <Label htmlFor="passwordModeToggle">
                                        <span className="mr0-5">{c('Label').t`Password protection`}</span>
                                    </Label>
                                    <div className="flex flex-justify-start mr0-5 on-mobile-mr0">
                                        <Toggle
                                            className="on-mobile-mb0-5"
                                            disabled={customPassword}
                                            id="passwordModeToggle"
                                            checked={passwordToggledOn}
                                            onChange={() => {
                                                onIncludePasswordToggle();
                                                if (!passwordToggledOn) {
                                                    setPassword(initialPassword);
                                                }
                                            }}
                                            data-testid="sharing-modal-passwordModeToggle"
                                        />
                                    </div>
                                    <div className="flex-no-min-children flex-item-fluid flex-align-items-center on-mobile-mb0-5 field-icon-container-empty on-mobile-min-h0">
                                        {passwordToggledOn && (
                                            <>
                                                <Label htmlFor="sharing-modal-password" className="sr-only">
                                                    {c('Label').t`Password`}
                                                </Label>
                                                <Input
                                                    id="sharing-modal-password"
                                                    data-testid="sharing-modal-password"
                                                    className="no-scroll text-ellipsis"
                                                    maxLength={50}
                                                    value={password}
                                                    onChange={handleChangePassword}
                                                />
                                            </>
                                        )}
                                    </div>
                                    <div className="flex-no-min-children flex-justify-end ml0-5 on-mobile-ml0">
                                        <Button
                                            id="copy-password-button"
                                            hidden={!passwordToggledOn}
                                            onClick={handleCopyPasswordClick}
                                            className="min-w7e"
                                        >{c('Action').t`Copy`}</Button>
                                    </div>
                                </div>
                                <div className="flex-no-min-children flex-nowrap mb1 on-mobile-flex-column on-mobile-mb0-5">
                                    <Label htmlFor="expirationTimeModeToggle">
                                        <span className="mr0-5">{c('Label').t`Expiration Date`}</span>
                                    </Label>
                                    <div className="flex flex-justify-start mr0-5 on-mobile-mr0">
                                        <Toggle
                                            className="on-mobile-mb0-5"
                                            id="expirationTimeModeToggle"
                                            checked={expirationToggledOn}
                                            onChange={() => {
                                                onIncludeExpirationTimeToogle();
                                            }}
                                            data-testid="sharing-modal-passwordModeToggle"
                                        />
                                    </div>
                                    <div className="flex-no-min-children flex-item-fluid flex-align-items-center on-mobile-mb0-5 field-icon-container-empty on-mobile-min-h0">
                                        {expirationToggledOn ? (
                                            <ExpirationTimeDatePicker
                                                expiration={expiration}
                                                handleExpirationChange={(exp: number) => setExpiration(exp)}
                                            />
                                        ) : (
                                            <span className="pl1 on-mobile-pl0">{c('Label').t`Never`}</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </InnerModal>
                {additionalSettingsExpanded && (
                    <FooterModal>
                        <div className="flex flex-justify-space-between w100 flex-nowrap">
                            <Button loading={deleting} onClick={onDeleteLinkClick}>{c('Action')
                                .t`Stop sharing`}</Button>
                            <div>
                                <ResetButton autoFocus>{c('Action').t`Close`}</ResetButton>
                                <PrimaryButton loading={saving} disabled={isSaveDisabled} className="ml1" type="submit">
                                    {c('Action').t`Save`}
                                </PrimaryButton>
                            </div>
                        </div>
                    </FooterModal>
                )}
            </ContentModal>
        </>
    );
}

export default GeneratedLinkState;
