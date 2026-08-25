import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { useOutgoingController } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import {
    getCanOutgoingDelegatedAccessRecoverStep1,
    getCanOutgoingDelegatedAccessRecoverStep2,
} from '@proton/account/delegatedAccess/shared/outgoing/helper';
import { selectMnemonicData } from '@proton/account/recovery/mnemonic';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import isTruthy from '@proton/utils/isTruthy';

import { FileForm, FileFormId } from './FileForm';
import { MnemonicForm, MnemonicFormId } from './MnemonicForm';
import { PasswordForm, PasswordFormId } from './PasswordForm';
import { RecoveryContactForm, RecoveryContactFormId } from './RecoveryContactForm';
import type { ReactivateKeysContentProps } from './interface';

export interface ReactivateKeysForm {
    id: string;
    title: string;
    content: ReactNode;
    /** Overrides the default submit label of the modal footer */
    cta?: string;
}

/**
 * The set of data recovery methods available to the user, and which one is currently selected. Must be rendered
 * inside an `OutgoingDelegatedAccessProvider`, since the recovery contacts tab depends on it.
 */
export const useReactivateKeysForms = (sharedProps: ReactivateKeysContentProps) => {
    const { mnemonicCanBeRegenerated, isMnemonicAvailable } = useSelector(selectMnemonicData);
    const delegatedAccessController = useOutgoingController();
    const [maybeId, setId] = useState<string | null>(null);

    const showMnemonicTab = isMnemonicAvailable && mnemonicCanBeRegenerated;

    const { showRecoveryContactsTab, canSomeContactRecoverStep2 } = (() => {
        const canSomeContactRecoverStep1 =
            delegatedAccessController.outgoingDelegatedAccess.recoveryContacts.hasAccess &&
            delegatedAccessController.outgoingDelegatedAccess.recoveryContacts.items.some(
                getCanOutgoingDelegatedAccessRecoverStep1
            );

        const canSomeContactRecoverStep2 =
            delegatedAccessController.outgoingDelegatedAccess.recoveryContacts.hasAccess &&
            delegatedAccessController.outgoingDelegatedAccess.recoveryContacts.items.some(
                getCanOutgoingDelegatedAccessRecoverStep2
            );

        return {
            showRecoveryContactsTab: canSomeContactRecoverStep1 || canSomeContactRecoverStep2,
            canSomeContactRecoverStep2,
        };
    })();

    const forms: ReactivateKeysForm[] = [
        showRecoveryContactsTab
            ? {
                  id: RecoveryContactFormId,
                  // translator: 'Contacts' here refers to 'Recovery contacts'
                  title: c('emergency_access').t`Contacts`,
                  content: <RecoveryContactForm {...sharedProps} />,
                  cta: canSomeContactRecoverStep2
                      ? c('Action').t`Recover data`
                      : c('emergency_access').t`Start recovery`,
              }
            : undefined,
        showMnemonicTab
            ? {
                  id: MnemonicFormId,
                  // translator: 'Phrase' here refers to the 'Recovery phrase'
                  title: c('Label').t`Phrase`,
                  content: <MnemonicForm {...sharedProps} />,
              }
            : undefined,
        {
            id: PasswordFormId,
            title: c('Label').t`Password`,
            content: <PasswordForm {...sharedProps} />,
        },
        {
            id: FileFormId,
            title: c('Label').t`File`,
            content: <FileForm {...sharedProps} />,
        },
    ].filter(isTruthy);

    const formIdx = forms.findIndex(({ id }) => id === maybeId);
    const selectedIdx = formIdx === -1 ? 0 : formIdx;
    const form = forms[selectedIdx];

    if (!form) {
        throw new Error('Unknown form');
    }

    return {
        forms,
        form,
        formIdx: selectedIdx,
        onFormIdxChange: (value: number) => setId(forms[value]?.id ?? null),
    };
};
