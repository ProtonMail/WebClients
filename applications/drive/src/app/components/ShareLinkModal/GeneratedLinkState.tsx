import { useEffect, useRef, useState } from 'react';
import * as React from 'react';

import { getUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import {
    Alert,
    Button,
    Details,
    FileNameDisplay,
    InputFieldTwo,
    InputTwo,
    Label,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PasswordInputTwo,
    PrimaryButton,
    Row,
    Summary,
    Toggle,
    useNotifications,
} from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import ExpirationTimeDatePicker from './ExpirationTimeDatePicker';

const MAX_CUSTOM_PASSWORD_LENGTH = 50;

interface Props {
    itemName: string;
    isFile: boolean;
    initialExpiration: number | null;
    url: string;
    passwordToggledOn: boolean;
    modificationDisabled: boolean;
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

const getSharingInfoMessage = (isFile: boolean) => {
    return isFile
        ? c('Info').t`Anyone with this link can access your file.`
        : c('Info').t`Anyone with this link can access your folder.`;
};

const getPasswordProtectedSharingInfoMessage = (isFile: boolean) => {
    return isFile
        ? c('Info').t`Only the people with the link and the password can access this file.`
        : c('Info').t`Only the people with the link and the password can access this folder.`;
};

function GeneratedLinkState({
    itemName,
    isFile,
    initialExpiration,
    url,
    customPassword,
    deleting,
    saving,
    passwordToggledOn,
    modificationDisabled,
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

    const isPasswordInvalid = password.length > MAX_CUSTOM_PASSWORD_LENGTH;
    const isFormInvalid = isPasswordInvalid;

    const isSaveDisabled =
        !isFormDirty ||
        deleting ||
        (passwordToggledOn && !password) ||
        (expirationToggledOn && !expiration) ||
        isFormInvalid;

    const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

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
        <span style={{ whiteSpace: 'nowrap' }}>
            <b key="name">
                <FileNameDisplay text={itemName} className="max-w80" />
            </b>
            :
        </span>
    );

    return (
        <>
            <ModalTwoHeader title={c('Title').t`Share via link`} closeButtonProps={{ disabled: saving || deleting }} />
            <ModalTwoContent>
                <div ref={contentRef}>
                    <p>{c('Info').jt`Shareable link for ${boldNameText}`}</p>
                    <Row className="on-mobile-mb0-5">
                        <div className="flex flex-item-fluid on-mobile-mb0-5">
                            <InputTwo
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
                        {
                            // Show message "protected by password" only when password is saved.
                            customPassword
                                ? getPasswordProtectedSharingInfoMessage(isFile)
                                : getSharingInfoMessage(isFile)
                        }
                    </Alert>
                    <Details
                        open={additionalSettingsExpanded}
                        onToggle={() => {
                            setAdditionalSettingsExpanded(!additionalSettingsExpanded);
                        }}
                        className="border-none"
                    >
                        <Summary tabIndex={0}>
                            <h3>{c('Title').t`Privacy settings`}</h3>
                        </Summary>
                        {modificationDisabled ? (
                            <Alert type="warning">
                                {c('Info')
                                    .t`This link was created with old Drive version and can not be modified. Delete this link and create a new one to change the settings.`}
                            </Alert>
                        ) : (
                            <>
                                <div className="flex-no-min-children flex-nowrap mb1 on-mobile-flex-column on-mobile-mb0-5">
                                    <Label htmlFor="passwordModeToggle">
                                        <span className="mr0-5">{c('Label').t`Protect with password`}</span>
                                    </Label>
                                    <div className="flex flex-justify-start pt0-5 mr0-5 on-mobile-mr0">
                                        <Toggle
                                            id="passwordModeToggle"
                                            className="on-mobile-mb0-5"
                                            disabled={saving}
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
                                    <div className="flex-no-min-children flex-item-fluid on-mobile-mb0-5 field-two-icon-container-empty on-mobile-min-h0">
                                        {passwordToggledOn && (
                                            <>
                                                <InputFieldTwo
                                                    id="sharing-modal-password"
                                                    as={PasswordInputTwo}
                                                    data-testid="sharing-modal-password"
                                                    labelContainerClassName="sr-only"
                                                    label={c('Label').t`Password`}
                                                    disabled={saving}
                                                    value={password}
                                                    error={
                                                        isPasswordInvalid &&
                                                        c('Info').ngettext(
                                                            msgid`Only ${MAX_CUSTOM_PASSWORD_LENGTH} character is allowed`,
                                                            `Only ${MAX_CUSTOM_PASSWORD_LENGTH} characters are allowed`,
                                                            MAX_CUSTOM_PASSWORD_LENGTH
                                                        )
                                                    }
                                                    assistiveText={`${password.length}/${MAX_CUSTOM_PASSWORD_LENGTH}`}
                                                    onInput={handleChangePassword}
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
                                    <div className="flex-no-min-children flex-item-fluid flex-align-items-center on-mobile-mb0-5 field-two-icon-container-empty on-mobile-min-h0">
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
                    </Details>
                </div>
            </ModalTwoContent>
            {additionalSettingsExpanded && (
                <ModalTwoFooter>
                    <div className="flex flex-justify-space-between w100">
                        <Button
                            loading={deleting}
                            disabled={saving}
                            onClick={onDeleteLinkClick}
                            className="on-mobile-mb0-5"
                        >{c('Action').t`Stop sharing`}</Button>
                        <div className="mlauto">
                            <Button type="reset" disabled={saving || deleting}>{c('Action').t`Close`}</Button>
                            <PrimaryButton
                                loading={saving}
                                disabled={isSaveDisabled}
                                className="ml1"
                                type="submit"
                                onClick={(e) => {
                                    e.preventDefault();
                                    void handleSubmit();
                                }}
                            >
                                {c('Action').t`Save`}
                            </PrimaryButton>
                        </div>
                    </div>
                </ModalTwoFooter>
            )}
        </>
    );
}

export default GeneratedLinkState;
