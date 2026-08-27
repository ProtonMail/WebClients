import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import getBoldFormattedText from '../../../helpers/getBoldFormattedText';
import { getResetOrganizationKeyDataText } from './helper';

interface Props {
    loading: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

/**
 * Confirmation shown when every member of the organization is already private, so the key can be reset right away
 * without converting anyone.
 */
const ResetConfirmStep = ({ loading, onConfirm, onClose }: Props) => {
    return (
        <>
            <ModalTwoHeader title={c('organization key reset').t`Reset organization key?`} />
            <ModalTwoContent>
                <p className="mt-0">
                    {c('organization key reset')
                        .t`You can reset your organization key to restore your administrator privileges. Then, you'll be able to create non-private users and access their accounts.`}
                </p>
                <p className="mb-0">{getBoldFormattedText(getResetOrganizationKeyDataText())}</p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" loading={loading} onClick={onConfirm}>
                    {c('Action').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};

export default ResetConfirmStep;
