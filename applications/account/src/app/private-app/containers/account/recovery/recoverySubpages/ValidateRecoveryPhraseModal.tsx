import { useState } from 'react';

import { c } from 'ttag';

import { validateMnemonicThunk } from '@proton/account/recovery/mnemonicActions';
import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import MnemonicInputField, {
    useMnemonicInputValidation,
} from '@proton/components/containers/mnemonic/MnemonicInputField';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import darkIllustration from './assets/recovery-phrase-dark.svg';
import illustration from './assets/recovery-phrase.svg';

interface Props extends ModalProps {}

export const ValidateRecoveryPhraseModal = ({ onClose, ...rest }: Props) => {
    const dispatch = useDispatch();
    const { validator, onFormSubmit } = useFormErrors();
    const [mnemonic, setMnemonic] = useState('');
    const [phraseError, setPhraseError] = useState(false);
    const incorrectPhraseError = c('Error')
        .t`This phrase cannot recover your account. You can generate a new one to ensure your account can be recovered in the future.`;
    const mnemonicValidation = useMnemonicInputValidation(mnemonic, {
        invalidFormatError: incorrectPhraseError,
    });
    const [submitting, withSubmitting] = useLoading();
    const [user] = useUser();
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const errorHandler = useErrorHandler();
    const { createNotification } = useNotifications();

    const emailOrNameToDisplay = user.Email || user.DisplayName || user.Name;

    const verifyMnemonic = async () => {
        const isValid = await dispatch(validateMnemonicThunk({ mnemonic }));
        if (!isValid) {
            setPhraseError(true);
            return;
        }
        createNotification({ text: c('Info').t`Recovery phrase verified` });
        onClose?.();
    };

    const handleSubmit = () => {
        if (!onFormSubmit()) {
            return;
        }
        setPhraseError(false);
        void withSubmitting(verifyMnemonic().catch(errorHandler));
    };

    return (
        <Modal as={Form} size="small" onSubmit={handleSubmit} onClose={onClose} {...rest}>
            <ModalHeader
                title={c('Title').t`Verify your phrase`}
                subline={emailOrNameToDisplay}
                leadingContent={
                    <img
                        src={isDarkTheme ? darkIllustration : illustration}
                        width={64}
                        height={64}
                        alt=""
                        className="hidden md:block mb-2"
                    />
                }
                closeButtonProps={{ pill: true, className: 'absolute right-0 top-0 mt-2 mr-2' }}
                className="flex flex-column items-center px-3 md:pb-4 md:pt-6 text-center"
            />
            <ModalContent>
                <div className="mb-4">{c('Info')
                    .t`Check if your recovery phrase can be used to fully recover your account.`}</div>
                <MnemonicInputField
                    disableChange={submitting}
                    value={mnemonic}
                    onValue={(value: string) => {
                        setPhraseError(false);
                        setMnemonic(value);
                    }}
                    autoFocus
                    error={validator([
                        requiredValidator(mnemonic),
                        ...mnemonicValidation,
                        phraseError ? incorrectPhraseError : '',
                    ])}
                />
            </ModalContent>
            <ModalFooter className="block">
                <div className="flex gap-2">
                    <Button type="submit" color="norm" fullWidth loading={submitting}>{c('Action').t`Verify`}</Button>
                    <Button onClick={onClose} fullWidth disabled={submitting}>{c('Action').t`Cancel`}</Button>
                </div>
            </ModalFooter>
        </Modal>
    );
};
