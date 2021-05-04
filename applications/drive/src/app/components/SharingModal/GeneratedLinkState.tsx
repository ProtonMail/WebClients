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
    onSaveLinkClick: (password?: string, duration?: number | null) => Promise<any>;
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

    const isSaveDisabled =
        !isFormDirty || deleting || (passwordToggledOn && !password) || (expirationToggledOn && !expiration);

    const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleCopyURLClick = () => {
        if (contentRef.current) {
            textToClipboard(
                !passwordToggledOn ? `${baseUrl}/${token}#${initialPassword}` : `${baseUrl}/${token}`,
                contentRef.current
            );
            createNotification({
                text: c('Success').t`The link to your file was successfully copied.`,
            });
        }
    };

    const handleSubmit = async () => {
        const newPassword = password !== initialPassword ? password : undefined;
        let newDuration: number | null | undefined = null;
        if (expirationToggledOn) {
            newDuration =
                expiration && expiration !== initialExpiration ? expiration - getUnixTime(Date.now()) : undefined;
        }

        const result = await onSaveLinkClick(newPassword, newDuration);

        // Because we are dealing with duration, ExpirationTime on server is expiration + request time.
        if (result && result?.ExpirationTime) {
            setExpiration(result.ExpirationTime);
        }
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
            {`${itemName}`}
        </b>
    );

    const url = `${baseUrl}/${token}${!passwordToggledOn ? `#${initialPassword}` : ''}`;

    return (
        <>
            <HeaderModal modalTitleID={modalTitleID} hasClose={!saving && !deleting} onClose={handleClose}>
                {c('Title').t`Share via link`}
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
                        <p>{c('Info').jt`Your secure, sharable link for ${boldNameText}:`}</p>
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
                                ).t`Copy link`}</PrimaryButton>
                            </div>
                        </Row>
                        <Alert>{c('Info').jt`Anyone with this link can access your file.`}</Alert>
                        <div className="flex flex-justify-space-between w100 flex-nowrap mt2 mb1 pr1">
                            <h3>{c('Title').t`Additional settings`}</h3>
                            <Icon
                                className={classnames([
                                    'cursor-pointer ',
                                    additionalSettingsExpanded ? 'rotateX-180' : undefined,
                                ])}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setAdditionalSettingsExpanded(!additionalSettingsExpanded);
                                }}
                                onKeyPress={(e) => {
                                    e.stopPropagation();
                                    setAdditionalSettingsExpanded(!additionalSettingsExpanded);
                                }}
                                tabIndex={0}
                                size={20}
                                name="caret"
                                alt={c('Title').t`Additional settings`}
                            />
                        </div>
                        {additionalSettingsExpanded && (
                            <>
                                <div className="flex-no-min-children flex-nowrap mb1 on-mobile-flex-column on-mobile-mb0-5">
                                    <Label htmlFor="passwordModeToggle">
                                        <span className="mr0-5">{c('Label').t`Protect with password`}</span>
                                    </Label>
                                    <div className="flex flex-justify-start pt0-5 mr0-5 on-mobile-mr0">
                                        <Toggle
                                            id="passwordModeToggle"
                                            className="on-mobile-mb0-5"
                                            disabled={customPassword || saving}
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
                                                    disabled={saving}
                                                    maxLength={50}
                                                    value={password}
                                                    onChange={handleChangePassword}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-no-min-children flex-nowrap mb1 on-mobile-flex-column on-mobile-mb0-5">
                                    <Label htmlFor="expirationTimeModeToggle">
                                        <span className="mr0-5">{c('Label').t`Set expiration date`}</span>
                                    </Label>
                                    <div className="flex flex-justify-start pt0-5 mr0-5 on-mobile-mr0">
                                        <Toggle
                                            id="expirationTimeModeToggle"
                                            className="on-mobile-mb0-5"
                                            disabled={saving}
                                            checked={expirationToggledOn}
                                            onChange={onIncludeExpirationTimeToogle}
                                            data-testid="sharing-modal-expirationTimeModeToggle"
                                        />
                                    </div>
                                    <div className="flex-no-min-children flex-item-fluid flex-align-items-center on-mobile-mb0-5 field-icon-container-empty on-mobile-min-h0">
                                        {expirationToggledOn && (
                                            <ExpirationTimeDatePicker
                                                disabled={saving}
                                                allowTime={false}
                                                expiration={expiration}
                                                handleExpirationChange={(exp: number) => setExpiration(exp)}
                                            />
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </InnerModal>
                {additionalSettingsExpanded && (
                    <FooterModal>
                        <div className="flex flex-justify-space-between w100">
                            <Button
                                loading={deleting}
                                disabled={saving}
                                onClick={onDeleteLinkClick}
                                className="on-mobile-mb0-5"
                            >{c('Action').t`Stop sharing`}</Button>
                            <div className="mlauto">
                                <Button type="reset" disabled={saving || deleting}>{c('Action').t`Close`}</Button>
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
