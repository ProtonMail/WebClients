import { useState } from 'react';

import { c } from 'ttag';

import { reactivateKeysByMnemonicThunk } from '@proton/account/addressKeys/reactivateKeysActions';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { getKeyReactivationNotification } from '@proton/components/containers/keys/reactivateKeys/reactivateHelper';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import MnemonicInputField, { useMnemonicInputValidation } from '../../mnemonic/MnemonicInputField';
import type { ReactivateKeysContentProps } from './interface';

export const MnemonicFormId = 'mnemonic-form';

export const MnemonicForm = ({ keyReactivationStates, onLoading, onClose }: ReactivateKeysContentProps) => {
    const isSubmitting = false;
    const [mnemonic, setMnemonic] = useState('');
    const mnemonicValidation = useMnemonicInputValidation(mnemonic);
    const { validator, onFormSubmit } = useFormErrors();
    const { createNotification } = useNotifications();

    const handleError = useErrorHandler();
    const dispatch = useDispatch();

    const handleSubmit = async () => {
        try {
            onLoading(true);

            const result = await dispatch(reactivateKeysByMnemonicThunk({ mnemonic, keyReactivationStates }));

            if (result.type === 'reactivated') {
                createNotification(getKeyReactivationNotification(result.payload));
                onClose?.();
                return;
            }

            if (result.type === 'nothing-outdated') {
                createNotification({
                    type: 'info',
                    text: c('Info').t`Recovery phrase is not associated with any outdated keys.`,
                });
                return;
            }

            if (result.type === 'no-association') {
                createNotification({
                    type: 'info',
                    text: c('Info').t`Recovery phrase is not associated with any keys.`,
                });
            }
        } catch (error) {
            handleError(error);
        } finally {
            onLoading(false);
        }
    };

    return (
        <form
            id={MnemonicFormId}
            onSubmit={(event) => {
                event.preventDefault();
                if (!onFormSubmit()) {
                    return;
                }
                void handleSubmit();
            }}
        >
            <div className="mb-4">{c('Info').t`This is a 12-word phrase that you were prompted to set.`}</div>
            <MnemonicInputField
                disableChange={isSubmitting}
                value={mnemonic}
                onValue={setMnemonic}
                autoFocus
                error={validator([requiredValidator(mnemonic), ...mnemonicValidation])}
            />
        </form>
    );
};
