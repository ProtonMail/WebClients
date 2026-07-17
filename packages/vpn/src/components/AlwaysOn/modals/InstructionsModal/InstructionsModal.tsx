import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import type { AlwaysOnPolicyArtifact } from '../../../../types/AlwaysOn';
import { InstructionsContent } from './InstructionsContent';

interface Props extends ModalProps {
    windows?: AlwaysOnPolicyArtifact;
    rego?: AlwaysOnPolicyArtifact;
}

export const InstructionsModal = ({ windows, rego, ...props }: Props) => (
    <ModalTwo {...props} size="large">
        <ModalTwoHeader title={c('Title').t`Configure Always-on VPN device profile`} />
        <ModalTwoContent>
            <InstructionsContent windows={windows} rego={rego} />
        </ModalTwoContent>
        <ModalTwoFooter>
            <Button color="norm" shape="solid" className="ml-auto" onClick={props.onClose}>
                {c('Action').t`Done`}
            </Button>
        </ModalTwoFooter>
    </ModalTwo>
);
