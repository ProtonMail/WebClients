import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton';
import SubUserCreateHint from '@proton/components/containers/members/SubUserCreateHint';
import CreateUserAccountsModal from '@proton/components/containers/members/multipleUserCreation/CreateUserAccountsModal/CreateUserAccountsModal';
import UploadCSVFileButton from '@proton/components/containers/members/multipleUserCreation/UploadCSVFileButton';
import { UserTemplate } from '@proton/components/containers/members/multipleUserCreation/types';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { Domain, EnhancedMember } from '@proton/shared/lib/interfaces';

import {
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    useModalState,
} from '../../components';
import { CsvConfig, downloadSampleCSV } from './multipleUserCreation/csv';

enum Step {
    INSTRUCTION,
    SELECT_USER,
}

interface IntroModalProps extends ModalProps {
    onBack: () => void;
    onCSVFileUpload: (usersToImport: UserTemplate[]) => void;
    csvConfig: CsvConfig;
}

const IntroModal = ({ onBack, onCSVFileUpload, csvConfig, ...rest }: IntroModalProps) => {
    const handleDownloadClick = () => {
        downloadSampleCSV(csvConfig);
    };

    return (
        <Modal {...rest}>
            <ModalHeader
                title={c('Title').t`Add user accounts`}
                subline={c('Title').t`Upload CSV file to create multiple accounts`}
            />
            <ModalContent className="pb-1">
                <ol className="flex flex-column gap-2 pl-5 mb-6">
                    <li>
                        <InlineLinkButton onClick={handleDownloadClick} color="norm" className="py-0">
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
    ...rest
}: Props) => {
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
                members={members}
                usersToImport={usersToImport}
                app={app}
                verifiedDomains={verifiedDomains}
                expectedCsvConfig={csvConfig}
                disableStorageValidation={disableStorageValidation}
                disableDomainValidation={disableDomainValidation}
                disableAddressValidation={disableAddressValidation}
                {...createUserAccountsModal}
                {...rest}
            />
        );
    }
    return <IntroModal {...rest} onBack={onBack} onCSVFileUpload={onCSVFileUpload} csvConfig={csvConfig} />;
};

export default SubUserBulkCreateModal;
