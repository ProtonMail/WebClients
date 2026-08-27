import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';

import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';

interface Props {
    /** Whether members were converted to private and now have to accept an unprivatization request */
    hasConvertedMembers: boolean;
    onDone: () => void;
}

const SuccessStep = ({ hasConvertedMembers, onDone }: Props) => {
    return (
        <>
            <ModalTwoHeader title={c('organization key reset').t`Organization key reset`} hasClose={false} />
            <ModalTwoContent>
                <div className="text-center mb-4">
                    <IcCheckmark size={12} className="color-success" />
                </div>
                <p className="mt-0">
                    {c('organization key reset')
                        .t`Your administrator privileges have been restored. You can now manage non-private users.`}
                </p>
                {hasConvertedMembers && (
                    <p className="mb-0">
                        {c('organization key reset')
                            .t`Your users will receive an email to accept the unprivatization request.`}
                    </p>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button fullWidth onClick={onDone}>{c('Action').t`Done`}</Button>
            </ModalTwoFooter>
        </>
    );
};

export default SuccessStep;
