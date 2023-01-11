import { c } from 'ttag';

import ProviderWrapper from '@proton/activation/components/Modals/Imap/ImapMailModal/ProviderWrapper';
import { MailImportPayloadError } from '@proton/activation/interface';
import { Button } from '@proton/atoms/Button';
import {
    Form,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useModalState,
} from '@proton/components/components';
import { useUser } from '@proton/components/hooks';

import CustomizeMailImportModal from '../../../CustomizeMailImportModal/CustomizeMailImportModal';
import StepPrepareContent from './StepPrepareContent';
import StepPrepareCustomButton from './StepPrepareCustomButton';
import StepPrepareError from './StepPrepareError';
import StepPrepareHeader from './StepPrepareHeader';
import useStepPrepare from './useStepPrepare';

const { MAX_FOLDERS_LIMIT_REACHED, FOLDER_NAMES_TOO_LONG, UNAVAILABLE_NAMES, RESERVED_NAMES, LABEL_NAMES_TOO_LONG } =
    MailImportPayloadError;

const StepPrepare = () => {
    const [user] = useUser();
    const [displayCustomizeModalProps, handleDisplayCustomizeModal, renderCustomizeModal] = useModalState();
    const {
        email,
        fields,
        isLabelMapping,
        selectedFolders,
        errors,
        hasErrors,
        hasUpdatedField,
        handleReset,
        handleSubmit,
        handleCancel,
        handleSubmitCustomizeModal,
        isConnectingToProvider,
        importSize,
        hasCategories,
    } = useStepPrepare({ user, handleCloseCustomizeModal: () => handleDisplayCustomizeModal(false) });
    const { importLabel, importPeriod, importAddress } = fields;

    return (
        <ModalTwo onClose={handleCancel} size="xlarge" open as={Form} onSubmit={handleSubmit}>
            <ModalTwoHeader title={c('Title').t`Start import process`} />
            <ModalTwoContent>
                <ProviderWrapper isConnectingToProvider={isConnectingToProvider}>
                    <StepPrepareError
                        isLabelMapping={isLabelMapping}
                        errors={errors}
                        // TODO: Check why user.MaxSpace * 2
                        showSizeWarning={importSize + user.UsedSpace >= user.MaxSpace * 2}
                    />

                    <StepPrepareHeader fromEmail={email} toEmail={importAddress?.Email || ''} />

                    <div className="pb1 mb1 border-bottom">
                        <StepPrepareContent
                            isLabelMapping={isLabelMapping}
                            selectedPeriod={importPeriod}
                            importLabel={importLabel}
                            showMaxFoldersError={errors.includes(MAX_FOLDERS_LIMIT_REACHED)}
                            providerFoldersCount={Object.keys(fields.mapping).length}
                            selectedFoldersCount={selectedFolders.length}
                        />

                        <StepPrepareCustomButton
                            hasError={errors.some((error) =>
                                [
                                    FOLDER_NAMES_TOO_LONG,
                                    LABEL_NAMES_TOO_LONG,
                                    UNAVAILABLE_NAMES,
                                    RESERVED_NAMES,
                                ].includes(error)
                            )}
                            handleClickCustomize={() => handleDisplayCustomizeModal(true)}
                            handleReset={handleReset}
                            isCustom={hasUpdatedField}
                            isLabelMapping={isLabelMapping}
                        />

                        {renderCustomizeModal && (
                            <CustomizeMailImportModal
                                displayCategories={hasCategories}
                                fields={fields}
                                foldersOpened={hasErrors}
                                importedEmail={email}
                                isLabelMapping={isLabelMapping}
                                modalProps={displayCustomizeModalProps}
                                onSubmit={handleSubmitCustomizeModal}
                            />
                        )}
                    </div>
                </ProviderWrapper>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button shape="outline" onClick={handleCancel}>
                    {c('Action').t`Cancel`}
                </Button>
                <PrimaryButton type="submit" disabled={hasErrors} loading={isConnectingToProvider}>{c('Action')
                    .t`Start import`}</PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default StepPrepare;
