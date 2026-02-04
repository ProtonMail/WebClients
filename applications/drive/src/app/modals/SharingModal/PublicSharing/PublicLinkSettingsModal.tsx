import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import {
    DateInputTwo,
    InputFieldTwo,
    Label,
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
import useLoading from '@proton/hooks/useLoading';
import { MAX_SHARED_URL_PASSWORD_LENGTH } from '@proton/shared/lib/drive/constants';

import { getMinMaxDate } from './helpers/getMinMaxDate';

const PublicLinkSettingsModal = ({
    expiration: initialExpiration,
    customPassword = '',
    onPublicLinkSettingsChange,
    onClose,
    onExit,
    open,
}: {
    expiration?: Date;
    customPassword?: string;
    onPublicLinkSettingsChange: ({
        customPassword,
        expiration,
    }: {
        customPassword?: string;
        expiration?: Date;
    }) => Promise<void | (unknown & { expirationTime: number | null })>;
} & ModalProps) => {
    const { min, max } = getMinMaxDate();

    const [confirmActionModal, showConfirmActionModal] = useConfirmActionModal();

    const [expiration, setExpiration] = useState(initialExpiration);
    const { state: expirationEnabled, toggle: toggleExpiration } = useToggle(!!initialExpiration);
    const handleChangeExpiration = (newExpiration?: Date) => {
        if (newExpiration) {
            const dateWithMaxTime = new Date(newExpiration);
            dateWithMaxTime.setHours(23, 59, 59, 999);
            setExpiration(dateWithMaxTime);
        } else {
            setExpiration(undefined);
        }
    };

    const [password, setPassword] = useState(customPassword);
    const { state: passwordEnabled, toggle: togglePasswordEnabled } = useToggle(!!customPassword);
    const isPasswordInvalid = !!password && password.length > MAX_SHARED_URL_PASSWORD_LENGTH;

    const [isFormDirty, setIsFormDirty] = useState(false);
    const [isSubmitting, withSubmitting] = useLoading();
    const isSaveDisabled = !isFormDirty || isPasswordInvalid;

    const expirationTime = expiration?.getTime();
    const initialExpirationTime = initialExpiration?.getTime();
    useEffect(() => {
        const expirationChanged =
            expirationTime !== initialExpirationTime || expirationEnabled !== !!initialExpirationTime;
        const passwordChanged = password !== customPassword || passwordEnabled !== !!customPassword;
        setIsFormDirty(Boolean(expirationChanged || passwordChanged));
    }, [customPassword, expirationTime, expirationEnabled, initialExpirationTime, password, passwordEnabled]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const newCustomPassword = !passwordEnabled || !password ? '' : password;
        const newExpiration = !expirationEnabled || !expiration ? undefined : expiration;

        // Instead of blocking user action, we just save the form without sending a request
        // For exemple if the user toggled the password field but don't put any password, we just don't do anything.
        // This make the UX smoother

        const needUpdate =
            newCustomPassword !== customPassword || newExpiration?.getTime() !== initialExpiration?.getTime();
        if (needUpdate) {
            await withSubmitting(
                onPublicLinkSettingsChange({ customPassword: newCustomPassword, expiration: newExpiration })
            );
        }
        onClose?.();
    };
    const handleClose = () => {
        if (!isFormDirty) {
            onClose?.();
            return;
        }

        void showConfirmActionModal({
            title: c('Title').t`Discard changes?`,
            submitText: c('Title').t`Discard`,
            message: c('Info').t`You will lose all unsaved changes.`,
            onSubmit: async () => onClose?.(),
            canUndo: true,
        });
    };

    return (
        <>
            <ModalTwo
                as="form"
                size="large"
                fullscreenOnMobile
                data-protonpass-autosave-ignore="true"
                onSubmit={handleSubmit}
                onClose={handleClose}
                onExit={onExit}
                open={open}
            >
                <ModalTwoHeader title={c('Title').t`Public link settings`} />
                <ModalTwoContent>
                    <div
                        className="flex flex-column justify-space-between gap-2  md:items-center md:gap-0 md:flex-row md:h-custom md:items-center "
                        style={{ '--h-custom': '2.25rem' }}
                        data-testid="sharing-modal-settings-expirationSection"
                    >
                        <Label htmlFor="expirationDateInputId" className={'flex flex-column p-0 text-semibold'}>
                            {c('Label').t`Set expiration date`}
                            <span className="color-weak text-normal">{c('Label').t`Public link expiration date`}</span>
                        </Label>
                        <div className="flex items-center justify-space-between gap-2 ">
                            {/* This hack is used to prevent firefox showing autocomplete on the time date picker field */}
                            <input className="hidden" type="email" />
                            <DateInputTwo
                                id="expirationDateInputId"
                                className="flex-1 grow-2 w-custom max-w-custom"
                                containerProps={{
                                    style: { '--w-custom': '12.5rem', '--max-w-custom': '12.5rem' },
                                }}
                                disabled={!expirationEnabled}
                                value={expiration}
                                onChange={handleChangeExpiration}
                                displayWeekNumbers={false}
                                min={min}
                                max={max}
                                placeholder={c('Title').t`Date`}
                                title={c('Title').t`Select link expiration date`}
                                hasToday={false}
                                data-testid="expiration-data-input"
                            />

                            <Toggle id="toggleExpiration" checked={expirationEnabled} onChange={toggleExpiration} />
                        </div>
                    </div>
                    <div
                        className="mt-5 flex  flex-column justify-space-between gap-2 md:flex-row md:gap-0 md:items-center md:h-custom w-auto md:flex-nowrap md:items-center"
                        style={{ '--h-custom': '2.25rem' }}
                        data-testid="sharing-modal-settings-passwordSection"
                    >
                        <Label className="flex flex-column p-0 text-semibold" htmlFor="sharing-modal-password">
                            {c('Label').t`Set link password`}
                            <span className="color-weak text-normal">{c('Label').t`Public link password`}</span>
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
                                data-testid="password-input"
                                label={false}
                                autoComplete="new-password"
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
                            <Toggle id="togglePassword" checked={passwordEnabled} onChange={togglePasswordEnabled} />
                        </div>
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={handleClose}>{c('Action').t`Back`}</Button>
                    <Button disabled={isSaveDisabled} loading={isSubmitting} color="norm" type="submit">{c('Action')
                        .t`Save changes`}</Button>
                </ModalTwoFooter>
            </ModalTwo>

            {confirmActionModal}
        </>
    );
};

export const usePublickLinkSettingsModal = () => {
    return useModalTwoStatic(PublicLinkSettingsModal);
};
