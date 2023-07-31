import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Form,
    ModalStateProps,
    ModalTwo,
    ModalTwoFooter,
    ModalTwoHeader,
    useModalState,
    useToggle,
} from '@proton/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';

import { MailImportFields } from './CustomizeMailImportModal.interface';
import Addresses from './CustomizeMailImportModalAddresses';
import CustomizeMailImportModalConfirmLeaveModal from './CustomizeMailImportModalConfirmLeaveModal';
import ImportMappingToggle from './CustomizeMailImportModalCustomizeFoldersToggle';
import GmailCategories from './CustomizeMailImportModalGmailCategories';
import Header from './CustomizeMailImportModalHeader';
import ImportLabelField from './CustomizeMailImportModalLabel';
import ImportPeriodField from './CustomizeMailImportModalPeriod';
import ManageFolders from './ManageFolders/ManageFolders';
import useCustomizeMailImportModal from './useCustomizeMailImportModal';

interface Props {
    fields: MailImportFields;
    foldersOpened: boolean;
    importedEmail: string;
    isLabelMapping: boolean;
    modalProps: ModalStateProps;
    displayCategories: boolean;
    onSubmit: (nextFields: MailImportFields) => void;
}

const CustomizeMailImportModal = ({
    foldersOpened = false,
    fields,
    importedEmail,
    isLabelMapping,
    modalProps,
    onSubmit,
    displayCategories,
}: Props) => {
    const [confirmLeaveModalProps, openConfirmLeaveModal, renderConfirmLeaveModal] = useModalState();
    const {
        customFields,
        handleCancel,
        handleChangeField,
        handleSaveErroredInput,
        handleSubmit,
        selectedFoldersCount,
        submitDisabled,
        totalFoldersCount,
    } = useCustomizeMailImportModal({
        fields,
        isLabelMapping,
        onClose: modalProps.onClose,
        onSubmit,
        openConfirmModal: () => openConfirmLeaveModal(true),
    });

    const { state: displayFolders, toggle: toggleFolders } = useToggle(foldersOpened);

    return (
        <>
            <ModalTwo {...modalProps} size="xlarge" onClose={handleCancel} as={Form} onSubmit={handleSubmit}>
                <ModalTwoHeader title={c('Title').t`Customize your mail import`} />
                <ModalContent>
                    <Header isLabelMapping={isLabelMapping} />

                    <ImportLabelField
                        label={customFields.importLabel}
                        onEditLabel={(nextLabel) => {
                            handleChangeField('importLabel', nextLabel);
                        }}
                    />
                    <Addresses
                        selectedAddressID={customFields.importAddress.ID}
                        onChange={(nextAddress) => handleChangeField('importAddress', nextAddress)}
                    />
                    <ImportPeriodField
                        selectedPeriod={customFields.importPeriod}
                        onChange={(nextPeriod) => handleChangeField('importPeriod', nextPeriod)}
                    />
                    <ImportMappingToggle
                        isLabelMapping={isLabelMapping}
                        organizeFolderVisible={displayFolders}
                        selectedFoldersCount={selectedFoldersCount}
                        toggleFolderVisibility={toggleFolders}
                        totalFoldersCount={totalFoldersCount}
                    />
                    <GmailCategories
                        handleChange={(nextCategoryDestination) =>
                            handleChangeField('importCategoriesDestination', nextCategoryDestination)
                        }
                        hasCategories={displayCategories}
                        selectedCategoriesDest={customFields.importCategoriesDestination}
                    />
                    {displayFolders && (
                        <ManageFolders
                            toEmail={customFields.importAddress.Email}
                            fromEmail={importedEmail}
                            isLabelMapping={isLabelMapping}
                            mapping={customFields.mapping}
                            onChange={(nextMapping) => handleChangeField('mapping', nextMapping)}
                            onErroredInputSaved={handleSaveErroredInput}
                        />
                    )}
                </ModalContent>
                <ModalTwoFooter>
                    <Button shape="outline" onClick={handleCancel} data-testid="CustomizeModal:modalCancel">
                        {c('Action').t`Cancel`}
                    </Button>
                    <Button color="norm" disabled={submitDisabled} type="submit" data-testid="CustomizeModal:modalSave">
                        {c('Action').t`Save`}
                    </Button>
                </ModalTwoFooter>
            </ModalTwo>

            {renderConfirmLeaveModal && (
                <CustomizeMailImportModalConfirmLeaveModal
                    onContinue={() => {
                        openConfirmLeaveModal(false);
                    }}
                    onStop={() => {
                        openConfirmLeaveModal(false);
                        modalProps.onClose();
                    }}
                    {...confirmLeaveModalProps}
                />
            )}
        </>
    );
};

export default CustomizeMailImportModal;
