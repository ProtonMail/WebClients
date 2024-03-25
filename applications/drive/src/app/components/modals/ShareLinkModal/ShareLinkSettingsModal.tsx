import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

import { getUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    Alert,
    InputFieldTwo,
    Label,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PasswordInputTwo,
    Toggle,
    useConfirmActionModal,
    useModalTwoStatic,
    useToggle,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { MAX_SHARED_URL_PASSWORD_LENGTH } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';

import ExpirationTimeDatePicker from './ExpirationTimeDatePicker';

interface Props {
    initialExpiration: number | null;
    customPassword: string;
    isDeleting?: boolean;
    deleteLink: () => Promise<void>;
    onSaveLinkClick: (
        password?: string,
        duration?: number | null
    ) => Promise<void | (unknown & { expirationTime: number | null })>;
    deleteShareEnabled: boolean;
    modificationDisabled: boolean;
    confirmationMessage: string;
    havePublicSharedLink: boolean;
}

const ShareLinkSettingsModal = ({
    customPassword,
    initialExpiration,
    onSaveLinkClick,
    isDeleting,
    deleteLink,
    deleteShareEnabled,
    modificationDisabled,
    confirmationMessage,
    havePublicSharedLink,
    ...modalProps
}: Props & ModalProps) => {
    const [password, setPassword] = useState(customPassword);
    const [expiration, setExpiration] = useState(initialExpiration);
    const [confirmActionModal, showConfirmActionModal] = useConfirmActionModal();
    const [isSubmitting, withSubmitting] = useLoading();
    const { state: passwordEnabled, toggle: togglePasswordEnabled } = useToggle(!!customPassword);
    const { state: expirationEnabled, toggle: toggleExpiration } = useToggle(!!initialExpiration);

    const isFormDirty = useMemo(() => {
        return Boolean(
            (expiration !== initialExpiration && expirationEnabled !== !!initialExpiration) ||
                (customPassword !== null && password !== customPassword && passwordEnabled !== !!customPassword)
        );
    }, [password, customPassword, passwordEnabled, expiration, initialExpiration, expirationEnabled]);

    const handleClose = () => {
        if (!isFormDirty) {
            modalProps.onClose?.();
            return;
        }

        void showConfirmActionModal({
            title: c('Title').t`Discard changes?`,
            submitText: c('Title').t`Discard`,
            message: c('Info').t`You will lose all unsaved changes.`,
            onSubmit: async () => modalProps.onClose?.(),
            canUndo: true,
        });
    };

    const handleDeleteLink = async () => {
        void showConfirmActionModal({
            title: c('Title').t`Stop sharing with everyone?`,
            submitText: c('Action').t`Stop sharing`,
            message: confirmationMessage,
            canUndo: true,
            onSubmit: () => deleteLink().finally(() => modalProps.onClose?.()),
        });
    };

    const isPasswordInvalid = password.length > MAX_SHARED_URL_PASSWORD_LENGTH;

    const isSaveDisabled = !isFormDirty || isDeleting || isPasswordInvalid;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        // The idea here is following:
        // newCustomPassword is undefined in case we don't want to update it
        // or newCustomPassword is an empty string when password needs to be removed
        // or newCustomPassword is, well, a password string
        let newCustomPassword;

        if (password !== customPassword) {
            newCustomPassword = password;
        }

        const newDuration =
            expiration && expiration !== initialExpiration ? expiration - getUnixTime(Date.now()) : null;

        await withSubmitting(onSaveLinkClick(newCustomPassword, newDuration));
        modalProps.onClose?.();
    };

    return (
        <>
            <ModalTwo
                as="form"
                size="large"
                onSubmit={handleSubmit}
                {...modalProps}
                onClose={handleClose}
                fullscreenOnMobile
            >
                <ModalTwoHeader title={c('Title').t`Settings`} />
                <ModalTwoContent>
                    {havePublicSharedLink && modificationDisabled && (
                        <Alert type="warning">
                            {c('Info')
                                .t`This link was created with old Drive version and can not be modified. Delete this link and create a new one to change the settings.`}
                        </Alert>
                    )}
                    <div
                        className="flex flex-column justify-space-between gap-2  md:items-center md:gap-0 md:flex-row md:h-custom md:items-center "
                        style={{ '--h-custom': '2.25rem' }}
                    >
                        <Label
                            htmlFor="epirationDateInputId"
                            className={clsx('p-0 text-semibold', !havePublicSharedLink && 'opacity-30')}
                        >
                            {c('Label').t`Set expiration date`}
                        </Label>
                        <div className="flex items-center justify-space-between gap-2 ">
                            <ExpirationTimeDatePicker
                                className="w-custom max-w-custom"
                                containerProps={{
                                    style: { '--w-custom': '12.5rem', '--max-w-custom': '12.5rem' },
                                }}
                                disabled={!expirationEnabled}
                                type="text"
                                allowTime={false}
                                expiration={expiration}
                                handleExpirationChange={setExpiration}
                                placeholder={c('Placeholder').t`Set date`}
                            />
                            <Toggle
                                disabled={!havePublicSharedLink}
                                id="toggleExpiration"
                                checked={expirationEnabled}
                                onChange={toggleExpiration}
                            />
                        </div>
                    </div>
                    <div
                        className="mt-5 flex  flex-column justify-space-between gap-2 md:flex-row md:gap-0 md:items-center md:h-custom w-auto md:flex-nowrap md:items-center"
                        style={{ '--h-custom': '2.25rem' }}
                    >
                        <Label
                            className={clsx('p-0 text-semibold', !havePublicSharedLink && 'opacity-30')}
                            htmlFor="sharing-modal-password"
                        >
                            {c('Label').t`Set link password`}
                        </Label>
                        <div className="flex items-center justify-space-between gap-2 md:flex-nowrap">
                            <InputFieldTwo
                                disabled={!passwordEnabled}
                                dense
                                className="items-center"
                                rootClassName="flex items-center justify-end pr-0 w-custom"
                                rootStyle={{ '--w-custom': '12.5rem' }}
                                id="sharing-modal-password"
                                as={PasswordInputTwo}
                                data-testid="sharing-modal-password"
                                label={false}
                                value={password}
                                onInput={(e: ChangeEvent<HTMLInputElement>) => {
                                    setPassword(e.target.value);
                                }}
                                error={
                                    isPasswordInvalid &&
                                    c('Info').ngettext(
                                        msgid`Max ${MAX_SHARED_URL_PASSWORD_LENGTH} character`,
                                        `Max ${MAX_SHARED_URL_PASSWORD_LENGTH} characters`,
                                        MAX_SHARED_URL_PASSWORD_LENGTH
                                    )
                                }
                                placeholder={c('Placeholder').t`Choose password`}
                            />
                            <Toggle
                                id="togglePassword"
                                disabled={!havePublicSharedLink}
                                checked={passwordEnabled}
                                onChange={togglePasswordEnabled}
                            />
                        </div>
                    </div>
                    <hr className="my-5" />
                    <div className="flex flex-nowrap justify-space-between items-center">
                        <div className={clsx('flex flex-column flex-1 p-0', !havePublicSharedLink && 'opacity-30')}>
                            <span className="text-semibold">{c('Label').t`Delete link`}</span>
                            <span className="color-weak">{c('Label')
                                .t`Erase this link and remove everyone with access`}</span>
                        </div>
                        <Button
                            disabled={!deleteShareEnabled}
                            className="flex items-center"
                            shape="ghost"
                            color="danger"
                            onClick={handleDeleteLink}
                        >{c('Action').t`Delete`}</Button>
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={modalProps.onClose}>{c('Action').t`Back`}</Button>
                    <Button disabled={isSaveDisabled} loading={isSubmitting} color="norm" type="submit">{c('Action')
                        .t`Save changes`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
            {confirmActionModal}
        </>
    );
};

export default ShareLinkSettingsModal;

export const useLinkSharingSettingsModal = () => {
    return useModalTwoStatic(ShareLinkSettingsModal);
};
