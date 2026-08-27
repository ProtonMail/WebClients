import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { pick } from '@proton/shared/lib/helpers/object';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { getInitialStates } from '@proton/shared/lib/keys/getInactiveKeys';
import type {
    KeyReactivationRequest,
    KeyReactivationRequestState,
} from '@proton/shared/lib/keys/reactivation/interface';

import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import { Tabs } from '../../../components/tabs/Tabs';
import type { ReactivateKeysContentProps } from '../../keys/reactivateKeys/interface';
import { useReactivateKeysForms } from '../../keys/reactivateKeys/useReactivateKeysForms';

interface Props {
    keyReactivationRequests: KeyReactivationRequest[];
    onTryAnotherWay: () => void;
    /** Called once the keys have been reactivated, which also restores access to the organization key. */
    onRecovered: () => void;
}

/**
 * The preferred way out: recovering the user's own inactive keys re-enables access to the organization key without
 * having to reset it, so it is offered before anything else.
 */
const DataRecoveryStep = ({ keyReactivationRequests, onTryAnotherWay, onRecovered }: Props) => {
    const [keyReactivationStates] = useState<KeyReactivationRequestState[]>(() =>
        getInitialStates(keyReactivationRequests)
    );
    const [loading, setLoading] = useState(false);

    const sharedProps: ReactivateKeysContentProps = {
        keyReactivationStates,
        onLoading: setLoading,
        loading,
        onClose: onRecovered,
    };

    const { forms, form, formIdx, onFormIdxChange } = useReactivateKeysForms(sharedProps);

    return (
        <>
            <ModalTwoHeader title={c('Title').t`Restore administrator privileges`} />
            <ModalTwoContent>
                <p className="mt-0">
                    {c('organization key reset')
                        .t`Because your organization key has changed, you lost some of your admin rights: You can no longer create non-private users and access their accounts.`}{' '}
                    <Href href={getKnowledgeBaseUrl('/restore-administrator')}>{c('Link').t`Learn more`}</Href>
                </p>
                <p>{c('organization key reset').t`To restore your privileges, use a data recovery method.`}</p>
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
                <Button onClick={onTryAnotherWay} disabled={loading}>
                    {c('organization key reset').t`Try another way`}
                </Button>
                <Button type="submit" color="norm" loading={loading} form={form.id}>
                    {form.cta ?? c('Action').t`Recover data`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};

export default DataRecoveryStep;
