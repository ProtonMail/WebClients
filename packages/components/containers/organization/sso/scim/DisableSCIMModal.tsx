import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import getBoldFormattedText from '../../../../helpers/getBoldFormattedText';

interface Props extends Omit<ModalProps, 'children' | 'title' | 'buttons'> {
    onConfirm: () => Promise<void>;
}

const DisableSCIMModal = ({ onClose, onConfirm, ...props }: Props) => {
    const [loading, withLoading] = useLoading();

    return (
        <ModalTwo size="small" {...props} onClose={onClose}>
            <ModalTwoHeader title={c('scim: Title').t`Disable SCIM integration?`} {...props} />
            <ModalTwoContent>
                <p>
                    <b>{c('scim: Info').t`The SCIM base URL and token will be deleted.`}</b>
                </p>
                <p>
                    {getBoldFormattedText(
                        c('scim: Info')
                            .t`Once SCIM is disabled for your organization, **all SCIM users provided automatically by your identity provider will be converted to SSO users** and you will be able to manage them directly within the ${BRAND_NAME} settings.`
                    )}
                </p>
                <p>
                    {c('scim: Info')
                        .t`To re-enable syncing with your identity provider, you need to complete the SCIM integration again.`}
                </p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="danger"
                    loading={loading}
                    onClick={() => {
                        withLoading(onConfirm()).catch(noop);
                    }}
                >
                    {c('scim: Action').t`Disable SCIM`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DisableSCIMModal;
