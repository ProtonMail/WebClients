import { useEffect, useRef, useState } from 'react';

import { getUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { Button, Input } from '@proton/atoms';
import {
    Alert,
    Details,
    FileNameDisplay,
    Icon,
    InputFieldTwo,
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

import ExpirationTimeDatePickerLEGACY from './ExpirationTimeDatePickerLEGACY';

const MAX_CUSTOM_PASSWORD_LENGTH = 50;

interface Props {
    itemName: string;
    sharedInfoMessage: string;
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
    onSaveLinkClick: (
        password?: string,
        duration?: number | null
    ) => Promise<void | (unknown & { expirationTime: number | null })>;
    onDeleteLinkClick: () => void;
    onIncludePasswordToggle: () => void;
    onIncludeExpirationTimeToogle: () => void;
    onFormStateChange: (state: { isFormDirty: boolean }) => void;
}

function GeneratedLinkStateLEGACY({
    itemName,
    sharedInfoMessage,
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
        if (result && result?.expirationTime) {
            setExpiration(result.expirationTime);
        }
    };

    const boldNameText = (
        <span key="name" style={{ whiteSpace: 'nowrap' }}>
            <b>
                <FileNameDisplay text={itemName} className="max-w-4/5" />
            </b>
            :
        </span>
    );

    return (
        <>
            <ModalTwoHeader title={c('Title').t`Share via link`} closeButtonProps={{ disabled: saving || deleting }} />
            <ModalTwoContent>
                <div ref={contentRef}>
                    <p data-testid="shareable-info-text">{c('Info').jt`Shareable link for ${boldNameText}`} </p>
                    <Row className="mb-2 md:mb-0">
                        <div className="flex md:flex-1 mb-2 md:mb-0">
                            <Input
                                readOnly
                                value={url}
                                className="overflow-hidden text-ellipsis"
                                data-testid="sharing-modal-url"
                            />
                        </div>
                        <div className="flex *:min-size-auto justify-end ml-0 md:ml-2">
                            <PrimaryButton
                                id="copy-url-button"
                                onClick={handleCopyURLClick}
                                className="min-w-custom"
                                style={{ '--min-w-custom': '7em' }}
                            >{c('Action').t`Copy link`}</PrimaryButton>
                        </div>
                    </Row>
                    <Alert data-testid="secure-link-text" className="mb-4">
                        {sharedInfoMessage}
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
                                <div className="flex *:min-size-auto flex-nowrap mb-4 flex-column md:flex-row mb-2 md:mb-0">
                                    <Label htmlFor="passwordModeToggle">
                                        <span className="mr-2">{c('Label').t`Protect with password`}</span>
                                    </Label>
                                    <div
                                        className="flex justify-start pt-2 mr-0 md:mr-2"
                                        data-testid="sharing-modal-passwordModeToggle"
                                    >
                                        <Toggle
                                            id="passwordModeToggle"
                                            className="mb-2 md:mb-0"
                                            disabled={saving}
                                            checked={passwordToggledOn}
                                            onChange={() => {
                                                onIncludePasswordToggle();
                                                if (!passwordToggledOn) {
                                                    setPassword(customPassword);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex *:min-size-auto md:flex-1 mb-2 md:mb-0 field-two-icon-container-empty min-h-0 md:min-h-none">
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
                                <div className="flex *:min-size-auto flex-nowrap flex-column md:flex-row mb-2 md:mb-4">
                                    <Label htmlFor="expirationTimeModeToggle">
                                        <span className="mr-2">{c('Label').t`Set expiration date`}</span>
                                    </Label>
                                    <div
                                        className="flex justify-start pt-2 mr-0 md:mr-2"
                                        data-testid="sharing-modal-expirationTimeModeToggle"
                                    >
                                        <Toggle
                                            id="expirationTimeModeToggle"
                                            className="mb-2 md:mb-0"
                                            disabled={saving}
                                            checked={expirationToggledOn}
                                            onChange={onIncludeExpirationTimeToogle}
                                        />
                                    </div>
                                    <div className="flex *:min-size-auto md:flex-1 items-center mb-2 md:mb-0 field-two-icon-container-empty min-h-0 md:min-h-none">
                                        {expirationToggledOn && (
                                            <ExpirationTimeDatePickerLEGACY
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
            <ModalTwoFooter>
                <div className="flex justify-space-between w-full">
                    <Button
                        loading={deleting}
                        disabled={saving}
                        onClick={onDeleteLinkClick}
                        className="mb-2 md:mb-0 inline-flex items-center"
                    >
                        <Icon name="link-slash" className="mr-2" />
                        {c('Action').t`Stop sharing`}
                    </Button>
                    <div className="ml-auto">
                        <PrimaryButton
                            loading={saving}
                            disabled={isSaveDisabled}
                            className="ml-4"
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
        </>
    );
}

export default GeneratedLinkStateLEGACY;
