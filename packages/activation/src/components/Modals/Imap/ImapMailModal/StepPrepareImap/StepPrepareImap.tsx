import { c } from 'ttag';

import { MailImportPayloadError } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms/Button';
import {
    Form,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useModalState,
} from '@proton/components';
import { useUser } from '@proton/components/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { getAppSpace, getSpace } from '@proton/shared/lib/user/storage';

import CustomizeMailImportModal from '../../../CustomizeMailImportModal/CustomizeMailImportModal';
import ProviderWrapper from '../ProviderWrapper';
import StepPrepareContent from './StepPrepareImapContent';
import StepPrepareCustomButton from './StepPrepareImapCustomButton';
import StepPrepareError from './StepPrepareImapError';
import StepPrepareHeader from './StepPrepareImapHeader';
import useStepPrepare from './useStepPrepareImap';

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
    const space = getAppSpace(getSpace(user), APPS.PROTONMAIL);

    return (
        <ModalTwo onClose={handleCancel} size="xlarge" open as={Form} onSubmit={handleSubmit}>
            <ModalTwoHeader title={c('Title').t`Start import process`} />
            <ModalTwoContent>
                <ProviderWrapper isConnectingToProvider={isConnectingToProvider}>
                    <StepPrepareError
                        isLabelMapping={isLabelMapping}
                        errors={errors}
                        // TODO: Check why user.MaxSpace * 2
                        showSizeWarning={importSize + space.usedSpace >= space.maxSpace * 2}
                    />

                    <StepPrepareHeader fromEmail={email} toEmail={importAddress?.Email || ''} />

                    <div className="pb-4 mb-4 border-bottom">
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
