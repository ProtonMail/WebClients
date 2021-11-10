import { useRef, useState, useEffect } from 'react';
import * as React from 'react';
import { c } from 'ttag';
import { getUnixTime } from 'date-fns';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import {
    Alert,
    Button,
    ContentModal,
    FooterModal,
    HeaderModal,
    InnerModal,
    Input,
    Label,
    PrimaryButton,
    Row,
    Toggle,
    useNotifications,
    Details,
    Summary,
    Tooltip,
    FileNameDisplay,
} from '@proton/components';

import ExpirationTimeDatePicker from './ExpirationTimeDatePicker';

interface Props {
    itemName: string;
    initialExpiration: number | null;
    url: string;
    passwordToggledOn: boolean;
    isValidForPasswordRemoval: boolean;
    expirationToggledOn: boolean;
    customPassword: string;
    modalTitleID: string;
    deleting?: boolean;
    saving?: boolean;
    onClose?: () => void;
    onSaveLinkClick: (password?: string, duration?: number | null) => Promise<any>;
    onDeleteLinkClick: () => void;
    onIncludePasswordToggle: () => void;
    onIncludeExpirationTimeToogle: () => void;
    onFormStateChange: (state: { isFormDirty: boolean }) => void;
}

function GeneratedLinkState({
    modalTitleID,
    onClose,
    itemName,
    initialExpiration,
    url,
    customPassword,
    deleting,
    saving,
    passwordToggledOn,
    isValidForPasswordRemoval,
    expirationToggledOn,
    onSaveLinkClick,
    onDeleteLinkClick,
    onIncludePasswordToggle,
    onIncludeExpirationTimeToogle,
    onFormStateChange,
}: Props) {
    const contentRef = useRef<HTMLDivElement>(null);
    const { createNotification } = useNotifications();

    const [password, setPassword] = useState(customPassword);
    const [expiration, setExpiration] = useState(initialExpiration);
    const [additionalSettingsExpanded, setAdditionalSettingsExpanded] = useState(
        Boolean(customPassword || initialExpiration)
    );

    const isFormDirty = Boolean(
        (expiration !== initialExpiration && expirationToggledOn) ||
            (initialExpiration && !expirationToggledOn) ||
            (password !== customPassword && passwordToggledOn) ||
            (!passwordToggledOn && customPassword)
    );

    const isSaveDisabled =
        !isFormDirty || deleting || (passwordToggledOn && !password) || (expirationToggledOn && !expiration);

    const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const SHARING_INFO_LABEL = {
        default: c('Info').t`Anyone with this link can access your file.`,
        withPassword: c('Info').t`Only the people with the link and the password can access this file.`,
    };

    const PASSWORD_TOGGLE_DISABLE_REASON = c('Info').t`This link was created in
        a previous version and can not be modified. Delete this link and create a
        new one to change the settings.`;

    useEffect(() => {
        onFormStateChange({ isFormDirty });
    }, [isFormDirty, onFormStateChange]);

    const handleCopyURLClick = () => {
        if (contentRef.current) {
            textToClipboard(url, contentRef.current);
            createNotification({
                text: c('Success').t`The link to your file was successfully copied`,
            });
        }
    };

    const handleSubmit = async () => {
        // The idea here is following:
        // newCustomPassword is undefined in case we don't want to update it
        // or newCustomPassword is an empty string when password needs to be removed
        // or newCustomPassword is, well, a password string
        let newCustomPassword;

        if (!passwordToggledOn) {
            if (customPassword.length !== 0) {
                newCustomPassword = '';
            }
        } else if (password !== customPassword) {
            newCustomPassword = password;
        }

        let newDuration: number | null | undefined = null;
        if (expirationToggledOn) {
            newDuration =
                expiration && expiration !== initialExpiration ? expiration - getUnixTime(Date.now()) : undefined;
        }

        const result = await onSaveLinkClick(newCustomPassword, newDuration);

        // Because we are dealing with duration, ExpirationTime on server is expiration + request time.
        if (result && result?.ExpirationTime) {
            setExpiration(result.ExpirationTime);
        }
    };

    const boldNameText = (
        <b key="name">
            <FileNameDisplay text={itemName} className="max-w80" />
        </b>
    );

    const passwordTooltipText = isValidForPasswordRemoval ? PASSWORD_TOGGLE_DISABLE_REASON : null;

    return (
        <>
            <HeaderModal modalTitleID={modalTitleID} hasClose={!saving && !deleting} onClose={onClose}>
                {c('Title').t`Share via link`}
            </HeaderModal>
            <ContentModal
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
                onReset={(e) => {
                    e.preventDefault();
                    onClose?.();
                }}
            >
                <InnerModal>
                    <div ref={contentRef}>
                        <p>{c('Info').jt`Your secure, shareable link for ${boldNameText}:`}</p>
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
                        <Alert className="mb1">
                            {password ? SHARING_INFO_LABEL.withPassword : SHARING_INFO_LABEL.default}
                        </Alert>
                        <Details
                            open={additionalSettingsExpanded}
                            onToggle={() => {
                                setAdditionalSettingsExpanded(!additionalSettingsExpanded);
                            }}
                            className="no-border"
                        >
                            <Summary tabIndex={0}>
                                <h3>{c('Title').t`Additional settings`}</h3>
                            </Summary>
                            <div className="flex-no-min-children flex-nowrap mb1 on-mobile-flex-column on-mobile-mb0-5">
                                <Label htmlFor="passwordModeToggle">
                                    <span className="mr0-5">{c('Label').t`Protect with password`}</span>
                                </Label>
                                <Tooltip title={passwordTooltipText}>
                                    <div className="flex flex-justify-start pt0-5 mr0-5 on-mobile-mr0">
                                        <Toggle
                                            id="passwordModeToggle"
                                            className="on-mobile-mb0-5"
                                            disabled={isValidForPasswordRemoval || saving}
                                            checked={passwordToggledOn}
                                            onChange={() => {
                                                onIncludePasswordToggle();
                                                if (!passwordToggledOn) {
                                                    setPassword(customPassword);
                                                }
                                            }}
                                            data-testid="sharing-modal-passwordModeToggle"
                                        />
                                    </div>
                                </Tooltip>
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
                        </Details>
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
