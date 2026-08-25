import { useState } from 'react';

import { c } from 'ttag';

import { OutgoingDelegatedAccessProvider } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import { Button } from '@proton/atoms/Button/Button';
import { pick } from '@proton/shared/lib/helpers/object';
import { getInitialStates } from '@proton/shared/lib/keys/getInactiveKeys';
import type {
    KeyReactivationRequest,
    KeyReactivationRequestState,
} from '@proton/shared/lib/keys/reactivation/interface';

import type { ModalProps } from '../../../components/modalTwo/Modal';
import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import { Tabs } from '../../../components/tabs/Tabs';
import type { ReactivateKeysContentProps } from './interface';
import { useReactivateKeysForms } from './useReactivateKeysForms';

interface Props extends ModalProps {
    keyReactivationRequests: KeyReactivationRequest[];
}

const InnerReactivateKeysModal = ({ keyReactivationRequests, ...rest }: Props) => {
    const [keyReactivationStates] = useState<KeyReactivationRequestState[]>(() =>
        getInitialStates(keyReactivationRequests)
    );
    const [loading, setLoading] = useState(false);

    const sharedProps: ReactivateKeysContentProps = {
        keyReactivationStates,
        onLoading: setLoading,
        loading,
        onClose: rest.onClose,
    };

    const { forms, form, formIdx, onFormIdxChange } = useReactivateKeysForms(sharedProps);

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
                        onFormIdxChange(value);
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
