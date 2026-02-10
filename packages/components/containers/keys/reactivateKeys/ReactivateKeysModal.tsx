import { useState } from 'react';

import { c } from 'ttag';

import {
    OutgoingDelegatedAccessProvider,
    useOutgoingController,
} from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import {
    getCanOutgoingDelegatedAccessRecoverStep1,
    getCanOutgoingDelegatedAccessRecoverStep2,
} from '@proton/account/delegatedAccess/shared/outgoing/helper';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { Tabs } from '@proton/components/components/tabs/Tabs';
import useIsMnemonicAvailable from '@proton/components/hooks/useIsMnemonicAvailable';
import { pick } from '@proton/shared/lib/helpers/object';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import { getInitialStates } from '@proton/shared/lib/keys/getInactiveKeys';
import type {
    KeyReactivationRequest,
    KeyReactivationRequestState,
} from '@proton/shared/lib/keys/reactivation/interface';
import isTruthy from '@proton/utils/isTruthy';

import { FileForm, FileFormId } from './FileForm';
import { MnemonicForm, MnemonicFormId } from './MnemonicForm';
import { PasswordForm, PasswordFormId } from './PasswordForm';
import { RecoveryContactForm, RecoveryContactFormId } from './RecoveryContactForm';
import type { ReactivateKeysContentProps } from './interface';

interface Props extends ModalProps {
    userKeys: DecryptedKey[];
    keyReactivationRequests: KeyReactivationRequest[];
}

const InnerReactivateKeysModal = ({ userKeys, keyReactivationRequests, ...rest }: Props) => {
    const [keyReactivationStates] = useState<KeyReactivationRequestState[]>(() =>
        getInitialStates(keyReactivationRequests)
    );
    const [user] = useUser();
    const [loading, setLoading] = useState(false);
    const [isMnemonicAvailable] = useIsMnemonicAvailable();
    const delegatedAccessController = useOutgoingController();

    const [maybeId, setId] = useState<string | null>(null);

    const showMnemonicTab =
        isMnemonicAvailable &&
        (user.MnemonicStatus === MNEMONIC_STATUS.SET || user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED);

    const { showRecoveryContactsTab, canSomeContactRecoverStep2 } = (() => {
        const canSomeContactRecoverStep1 =
            delegatedAccessController.meta.recoveryContacts.hasAccess &&
            delegatedAccessController.items.recoveryContacts.some(getCanOutgoingDelegatedAccessRecoverStep1);

        const canSomeContactRecoverStep2 =
            delegatedAccessController.meta.recoveryContacts.hasAccess &&
            delegatedAccessController.items.recoveryContacts.some(getCanOutgoingDelegatedAccessRecoverStep2);

        return {
            showRecoveryContactsTab: canSomeContactRecoverStep1 || canSomeContactRecoverStep2,
            canSomeContactRecoverStep2,
        };
    })();

    const sharedProps: ReactivateKeysContentProps = {
        keyReactivationStates,
        onLoading: setLoading,
        loading,
        onClose: rest.onClose,
    };

    const forms = [
        showRecoveryContactsTab
            ? {
                  id: RecoveryContactFormId,
                  // translator: 'Contacts' here refers to 'Recovery contacts'
                  title: c('emergency_access').t`Contacts`,
                  content: <RecoveryContactForm {...sharedProps} />,
                  cta: canSomeContactRecoverStep2
                      ? c('Action').t`Recover data`
                      : c('emergency_access').t`Send email request`,
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
    const form = forms[formIdx === -1 ? 0 : formIdx];

    if (!form) {
        throw new Error('Unknown form');
    }

    return (
        <ModalTwo size="medium" {...rest}>
            <ModalTwoHeader title={c('Title').t`Recover data`} />
            <ModalTwoContent>
                <p className="mt-0">
                    {c('Info')
                        .t`To decrypt and view your locked data after a password reset, select a recovery method.`}
                </p>
                <Tabs
                    value={formIdx}
                    tabs={forms.map((value) => pick(value, ['title', 'content']))}
                    onChange={(value) => {
                        // Prevent switching tabs while processing
                        if (loading) {
                            return;
                        }
                        setId(forms[value]?.id ?? null);
                    }}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>
                <Button type="submit" color="norm" loading={loading} form={form.id}>
                    {form.cta ?? c('Action').t`Recover data`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

const ReactivateKeysModal = (props: Props) => {
    return (
        <OutgoingDelegatedAccessProvider>
            <InnerReactivateKeysModal {...props} />
        </OutgoingDelegatedAccessProvider>
    );
};

export default ReactivateKeysModal;
