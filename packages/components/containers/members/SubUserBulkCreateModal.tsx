import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { CreateMemberMode, Domain, EnhancedMember } from '@proton/shared/lib/interfaces';

import type { ModalProps } from '../../components/modalTwo/Modal';
import Modal from '../../components/modalTwo/Modal';
import ModalContent from '../../components/modalTwo/ModalContent';
import ModalFooter from '../../components/modalTwo/ModalFooter';
import ModalHeader from '../../components/modalTwo/ModalHeader';
import useModalState from '../../components/modalTwo/useModalState';
import CreateUserAccountsModal from './multipleUserCreation/CreateUserAccountsModal/CreateUserAccountsModal';
import DownloadCsvSampleButton from './multipleUserCreation/DownloadCsvSampleButton';
import UploadCSVFileButton from './multipleUserCreation/UploadCSVFileButton/index';
import type { CsvConfig } from './multipleUserCreation/csv';
import type { UserTemplate } from './multipleUserCreation/types';

enum Step {
    INSTRUCTION,
    SELECT_USER,
}

interface IntroModalProps extends ModalProps {
    onBack: () => void;
    onCSVFileUpload: (usersToImport: UserTemplate[], detectedMode: CreateMemberMode) => void;
    csvConfig: CsvConfig;
}

const IntroModal = ({ onBack, onCSVFileUpload, csvConfig, ...rest }: IntroModalProps) => {
    return (
        <Modal {...rest}>
            <ModalHeader
                title={c('Title').t`Add user accounts`}
                subline={c('Title').t`Upload CSV file to create multiple accounts`}
            />
            <ModalContent className="pb-1">
                <ol className="flex flex-column gap-2 pl-5 mb-6">
                    <li>
                        <DownloadCsvSampleButton
                            as={InlineLinkButton}
                            color="norm"
                            className="py-0"
                            content={c('Action').t`Download our CSV template`}
                            csvConfig={csvConfig}
                        />
                    </li>
                    <li>{c('Info').t`Fill in user details`}</li>
                    <li>{c('Info').t`Upload your completed CSV file to create accounts`}</li>
                </ol>
            </ModalContent>
            <ModalFooter>
                <Button onClick={onBack}>{c('Action').t`Back`}</Button>
                <UploadCSVFileButton onUpload={onCSVFileUpload} color="norm" csvConfig={csvConfig} />
            </ModalFooter>
        </Modal>
    );
};

interface Props extends ModalProps {
    onBack: () => void;
    app: APP_NAMES;
    verifiedDomains: Domain[];
    members: EnhancedMember[] | undefined;
    csvConfig: CsvConfig;
    disableStorageValidation?: boolean;
    disableDomainValidation?: boolean;
    disableAddressValidation?: boolean;
    useEmail?: boolean;
}

const SubUserBulkCreateModal = ({
    onBack,
    app,
    verifiedDomains,
    members,
    csvConfig,
    disableStorageValidation,
    disableDomainValidation,
    disableAddressValidation,
    useEmail,
    ...rest
}: Props) => {
    const [step, setStep] = useState<Step>(Step.INSTRUCTION);
    const [detectedMode, setDetectedMode] = useState(csvConfig.mode);
    const [usersToImport, setUsersToImport] = useState<UserTemplate[]>();
    const [createUserAccountsModal, setCreateUserAccountsModal, renderCreateUserAccountsModal] = useModalState();

    const onCSVFileUpload = (usersToImport: UserTemplate[], detectedMode: CreateMemberMode) => {
        setUsersToImport(usersToImport);
        setDetectedMode(detectedMode);
        setCreateUserAccountsModal(true);
        setStep(Step.SELECT_USER);
    };

    if (step === Step.SELECT_USER && renderCreateUserAccountsModal && usersToImport) {
        return (
            <CreateUserAccountsModal
                members={members}
                usersToImport={usersToImport}
                app={app}
                verifiedDomains={verifiedDomains}
                expectedCsvConfig={{ ...csvConfig, mode: detectedMode }}
                disableStorageValidation={disableStorageValidation}
                disableDomainValidation={disableDomainValidation}
                disableAddressValidation={disableAddressValidation}
                useEmail={useEmail}
                mode={detectedMode}
                {...createUserAccountsModal}
                {...rest}
            />
        );
    }
    return <IntroModal {...rest} onBack={onBack} onCSVFileUpload={onCSVFileUpload} csvConfig={csvConfig} />;
};

export default SubUserBulkCreateModal;
