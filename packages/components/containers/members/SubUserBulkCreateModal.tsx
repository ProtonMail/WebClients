import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import SubUserCreateHint from '@proton/components/containers/members/SubUserCreateHint';
import CreateUserAccountsModal from '@proton/components/containers/members/multipleUserCreation/CreateUserAccountsModal/CreateUserAccountsModal';
import UploadCSVFileButton from '@proton/components/containers/members/multipleUserCreation/UploadCSVFileButton';
import { downloadVPNB2BSampleCSV } from '@proton/components/containers/members/multipleUserCreation/csv';
import { UserTemplate } from '@proton/components/containers/members/multipleUserCreation/types';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { Domain } from '@proton/shared/lib/interfaces';

import {
    InlineLinkButton,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    useModalState,
} from '../../components';
import { UserManagementMode } from './types';

enum Step {
    INSTRUCTION,
    SELECT_USER,
}

interface IntroModalProps extends ModalProps {
    onBack: () => void;
    onCSVFileUpload: (usersToImport: UserTemplate[]) => void;
}

const IntroModal = ({ onBack, onCSVFileUpload, ...rest }: IntroModalProps) => {
    return (
        <Modal {...rest}>
            <ModalHeader
                title={c('Title').t`Add user accounts`}
                subline={c('Title').t`Upload CSV file to create multiple accounts`}
            />
            <ModalContent className="pb-1">
                <ol className="flex flex-column gap-2 pl-5 mb-6">
                    <li>
                        <InlineLinkButton onClick={downloadVPNB2BSampleCSV} color="norm" className="py-0">
                            {c('Action').t`Download our CSV template`}
                        </InlineLinkButton>
                    </li>
                    <li>{c('Info').t`Fill in user details`}</li>
                    <li>{c('Info').t`Upload your completed CSV file to create accounts`}</li>
                </ol>
                <SubUserCreateHint className="mt-2" />
            </ModalContent>
            <ModalFooter>
                <Button onClick={onBack}>{c('Action').t`Back`}</Button>
                <UploadCSVFileButton onUpload={onCSVFileUpload} color="norm" mode={UserManagementMode.VPN_B2B} />
            </ModalFooter>
        </Modal>
    );
};

interface Props extends ModalProps {
    onBack: () => void;
    app: APP_NAMES;
    verifiedDomains: Domain[];
}

const SubUserBulkCreateModal = ({ verifiedDomains, onBack, app, ...rest }: Props) => {
    const [step, setStep] = useState<Step>(Step.INSTRUCTION);
    const [usersToImport, setUsersToImport] = useState<UserTemplate[]>();
    const [createUserAccountsModal, setCreateUserAccountsModal, renderCreateUserAccountsModal] = useModalState();
    const onCSVFileUpload = (usersToImport: UserTemplate[]) => {
        setUsersToImport(usersToImport);
        setCreateUserAccountsModal(true);
        setStep(Step.SELECT_USER);
    };

    if (step === Step.SELECT_USER && renderCreateUserAccountsModal && usersToImport) {
        return (
            <CreateUserAccountsModal
                usersToImport={usersToImport}
                app={app}
                verifiedDomains={verifiedDomains}
                {...createUserAccountsModal}
                mode={UserManagementMode.VPN_B2B}
                {...rest}
            />
        );
    }
    return <IntroModal {...rest} onBack={onBack} onCSVFileUpload={onCSVFileUpload} />;
};

export default SubUserBulkCreateModal;
