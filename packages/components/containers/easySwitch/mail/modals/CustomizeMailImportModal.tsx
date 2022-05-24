import { useState, ChangeEvent, useMemo } from 'react';
import { subYears, subMonths } from 'date-fns';
import { c, msgid } from 'ttag';

import noop from '@proton/utils/noop';
import { Address, Label } from '@proton/shared/lib/interfaces';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import {
    MailImporterPayload,
    ImportedMailFolder,
    TIME_PERIOD,
    MailImportPayloadError,
} from '@proton/shared/lib/interfaces/EasySwitch';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

import EditLabelModal, { LabelModel } from '../../../labels/modals/EditLabelModal';

import { useModals } from '../../../../hooks';
import {
    Row,
    Tooltip,
    Alert,
    Field,
    Icon,
    LabelStack,
    Select,
    ConfirmModal,
    FormModal,
    Button,
    Label as FormLabel,
    useModalState,
} from '../../../../components';

import { getTimeUnitLabels } from '../../constants';
import ImportManageFolders from './ImportManageFolders';
import useIAMailPayload from '../../hooks/useIAMailPayload';

interface Props {
    payload: MailImporterPayload;
    addresses: Address[];
    onClose?: () => void;
    customizeFoldersOpen: boolean;
    isLabelMapping: boolean;
    folders: Folder[];
    labels: Label[];
    providerFolders: ImportedMailFolder[];
    importedEmail: string;
    selectedPeriod: TIME_PERIOD;
    updateModel: (selectedPeriod: TIME_PERIOD, payload: MailImporterPayload) => void;
}

const { FOLDER_NAMES_TOO_LONG, LABEL_NAMES_TOO_LONG, UNAVAILABLE_NAMES, MAX_FOLDERS_LIMIT_REACHED, RESERVED_NAMES } =
    MailImportPayloadError;

const CustomizeMailImportModal = ({
    payload,
    addresses,
    onClose = noop,
    customizeFoldersOpen = false,
    isLabelMapping,
    folders,
    labels,
    providerFolders,
    importedEmail,
    selectedPeriod: initialSelectedPeriod,
    updateModel,
    ...rest
}: Props) => {
    const timeUnitLabels = getTimeUnitLabels();

    const initialPayload = payload;
    const [customizedPayload, setCustomizedPayload] = useState({ ...initialPayload });
    const [selectedPeriod, setSelectedPeriod] = useState(initialSelectedPeriod);
    const [selectedAddressID, setSelectedAddressID] = useState(initialPayload.AddressID);
    const [organizeFolderVisible, setOrganizeFolderVisible] = useState(customizeFoldersOpen);
    const { createModal } = useModals();
    const [isEditing, setIsEditing] = useState(false);

    const [editLabelProps, setEditLabelModalOpen] = useModalState();

    const { getMailMappingErrors } = useIAMailPayload({
        email: importedEmail,
        providerFolders,
        isLabelMapping,
        folders,
        labels,
    });

    const mappingErrors = useMemo(() => getMailMappingErrors(customizedPayload.Mapping), [customizedPayload.Mapping]);

    const hasMaxFoldersError = mappingErrors.includes(MAX_FOLDERS_LIMIT_REACHED);
    const hasUnavailableNamesError = mappingErrors.includes(UNAVAILABLE_NAMES);
    const hasFoldersTooLongError = mappingErrors.includes(FOLDER_NAMES_TOO_LONG);
    const hasLabelsTooLongError = mappingErrors.includes(LABEL_NAMES_TOO_LONG);
    const hasReservedNamesError = mappingErrors.includes(RESERVED_NAMES);

    const addressesOptions = addresses
        .filter((addr) => addr.Keys.some((k) => k.Active) && addr.Status === ADDRESS_STATUS.STATUS_ENABLED)
        .map((addr) => ({
            value: addr.ID,
            text: addr.Email,
        }));

    const hasChanged = useMemo(() => {
        if (
            customizedPayload.StartTime !== initialPayload.StartTime ||
            !isDeepEqual(customizedPayload.Mapping, initialPayload.Mapping) ||
            !isDeepEqual(customizedPayload.ImportLabel, initialPayload.ImportLabel)
        ) {
            return true;
        }

        return false;
    }, [customizedPayload.ImportLabel, customizedPayload.StartTime, customizedPayload.Mapping]);

    const handleChangePayload = (newPayload: MailImporterPayload) => setCustomizedPayload(newPayload);

    const handleCancel = () => {
        if (!hasChanged) {
            onClose();
            return;
        }

        createModal(
            <ConfirmModal
                onConfirm={onClose}
                title={c('Confirm modal title').t`Quit import customization?`}
                cancel={c('Action').t`Stay`}
                confirm={<Button color="danger" type="submit">{c('Action').t`Quit`}</Button>}
            >
                <Alert className="mb1" type="error">{c('Warning')
                    .t`You will lose any customization you made so far.`}</Alert>
            </ConfirmModal>
        );
    };

    const toggleFolders = () => {
        setOrganizeFolderVisible(!organizeFolderVisible);
    };

    const handleEditLabel = (ImportLabel: LabelModel) => {
        setCustomizedPayload({ ...customizedPayload, ImportLabel });
    };

    const handleChangeAddress = (AddressID: string) => {
        setSelectedAddressID(AddressID);

        setCustomizedPayload({
            ...customizedPayload,
            AddressID,
        });
    };

    const handleChangePeriod = (selectedPeriod: TIME_PERIOD) => {
        const now = new Date();
        let StartTime: Date | undefined;

        switch (selectedPeriod) {
            case TIME_PERIOD.LAST_YEAR:
                StartTime = subYears(now, 1);
                break;
            case TIME_PERIOD.LAST_3_MONTHS:
                StartTime = subMonths(now, 3);
                break;
            case TIME_PERIOD.LAST_MONTH:
                StartTime = subMonths(now, 1);
                break;
            default:
                StartTime = undefined;
                break;
        }

        setSelectedPeriod(selectedPeriod);
        setCustomizedPayload({
            ...customizedPayload,
            StartTime,
        });
    };

    const totalFoldersCount = providerFolders.length;
    const selectedFoldersCount = customizedPayload.Mapping.filter((m) => m.checked).length;

    const handleSubmit = () => {
        updateModel(selectedPeriod, customizedPayload);
        onClose();
    };

    const toggleEditing = (editing: boolean) => {
        setIsEditing(editing);
    };

    const hideCopy = isLabelMapping ? c('Action').t`Hide labels` : c('Action').t`Hide folders`;
    const showCopy = isLabelMapping ? c('Action').t`Show labels` : c('Action').t`Show folders`;
    const toggleActionCopy = organizeFolderVisible ? hideCopy : showCopy;

    const submitDisabled =
        isEditing ||
        !selectedFoldersCount ||
        hasMaxFoldersError ||
        hasFoldersTooLongError ||
        hasLabelsTooLongError ||
        hasUnavailableNamesError ||
        hasReservedNamesError;

    return (
        <FormModal
            title={c('Title').t`Customize your mail import`}
            submit={
                <Button color="norm" disabled={submitDisabled} type="submit">
                    {c('Action').t`Save`}
                </Button>
            }
            close={c('Action').t`Cancel`}
            onSubmit={handleSubmit}
            onClose={handleCancel}
            className="customize-import-modal"
            {...rest}
        >
            <div className="mb1">
                {isLabelMapping
                    ? c('Info')
                          .t`Create a label for the imported messages, a time range for this import, and the labels you would like to import.`
                    : c('Info')
                          .t`Create a label for the imported messages, a time range for this import, and the folders you would like to import.`}
            </div>

            <div className="mb1 border-bottom flex-align-items-center">
                <Row>
                    <FormLabel className="flex flex-align-items-center">
                        {c('Label').t`Label messages as`}
                        <Tooltip title={c('Tooltip').t`Each imported email will have this label`}>
                            <Icon name="info-circle" className="ml0-5" />
                        </Tooltip>
                    </FormLabel>
                    <Field className="wauto flex flex-align-items-center flex-nowrap">
                        {customizedPayload.ImportLabel && customizedPayload.ImportLabel.Name && (
                            <LabelStack
                                labels={[
                                    {
                                        name: customizedPayload.ImportLabel.Name,
                                        color: customizedPayload.ImportLabel.Color,
                                        title: customizedPayload.ImportLabel.Name,
                                    },
                                ]}
                                className="max-w100"
                            />
                        )}
                        <Button
                            shape="outline"
                            className="flex-item-noshrink ml1"
                            onClick={() => setEditLabelModalOpen(true)}
                        >
                            {c('Action').t`Edit label`}
                        </Button>
                    </Field>
                    <EditLabelModal
                        {...editLabelProps}
                        label={customizedPayload.ImportLabel}
                        type="label"
                        onCheckAvailable={handleEditLabel}
                        mode="checkAvailable"
                    />
                </Row>
            </div>

            {addresses.length > 1 && (
                <div className="mb1 border-bottom flex-align-items-center">
                    <Row>
                        <FormLabel className="flex flex-align-items-center">
                            {c('Label').t`Import to email address`}
                        </FormLabel>
                        <Field>
                            <Select
                                className="flex-item-fluid"
                                onChange={({ target }: ChangeEvent<HTMLSelectElement>) =>
                                    handleChangeAddress(target.value)
                                }
                                options={addressesOptions}
                                value={selectedAddressID}
                            />
                        </Field>
                    </Row>
                </div>
            )}

            <div className="mb1 border-bottom flex-align-items-center">
                <Row>
                    <FormLabel className="flex flex-align-items-center">
                        {c('Label').t`Import interval`}
                        <Tooltip title={c('Tooltip').t`The import will start with the most recent messages.`}>
                            <Icon name="info-circle" className="ml0-5" />
                        </Tooltip>
                    </FormLabel>
                    <Field>
                        <Select
                            className="flex-item-fluid"
                            onChange={({ target }: ChangeEvent<HTMLSelectElement>) =>
                                handleChangePeriod(target.value as TIME_PERIOD)
                            }
                            options={[
                                {
                                    value: TIME_PERIOD.BIG_BANG,
                                    text: timeUnitLabels[TIME_PERIOD.BIG_BANG],
                                },
                                {
                                    value: TIME_PERIOD.LAST_YEAR,
                                    text: timeUnitLabels[TIME_PERIOD.LAST_YEAR],
                                },
                                {
                                    value: TIME_PERIOD.LAST_3_MONTHS,
                                    text: timeUnitLabels[TIME_PERIOD.LAST_3_MONTHS],
                                },
                                {
                                    value: TIME_PERIOD.LAST_MONTH,
                                    text: timeUnitLabels[TIME_PERIOD.LAST_MONTH],
                                },
                            ]}
                            value={selectedPeriod}
                        />
                    </Field>
                </Row>
            </div>

            <div className="mb1 flex-align-items-center">
                <Row>
                    <FormLabel>{isLabelMapping ? c('Label').t`Manage labels` : c('Label').t`Manage folders`}</FormLabel>
                    <div className="flex flex-align-items-center">
                        <Icon name={isLabelMapping ? 'tags' : 'folders'} className="mr0-5" />
                        {selectedFoldersCount === totalFoldersCount ? (
                            <span>
                                {isLabelMapping
                                    ? c('Info').ngettext(
                                          msgid`All (${totalFoldersCount} label)`,
                                          `All (${totalFoldersCount} labels)`,
                                          totalFoldersCount
                                      )
                                    : c('Info').ngettext(
                                          msgid`All (${totalFoldersCount} folder)`,
                                          `All (${totalFoldersCount} folders)`,
                                          totalFoldersCount
                                      )}
                            </span>
                        ) : (
                            <span>
                                {isLabelMapping
                                    ? c('Info').ngettext(
                                          msgid`${selectedFoldersCount} label selected`,
                                          `${selectedFoldersCount} labels selected`,
                                          selectedFoldersCount
                                      )
                                    : c('Info').ngettext(
                                          msgid`${selectedFoldersCount} folder selected`,
                                          `${selectedFoldersCount} folders selected`,
                                          selectedFoldersCount
                                      )}
                            </span>
                        )}
                        <Button shape="outline" className="ml2" onClick={toggleFolders}>
                            {toggleActionCopy}
                        </Button>
                    </div>
                </Row>
            </div>

            {organizeFolderVisible && (
                <ImportManageFolders
                    addresses={addresses}
                    providerFolders={providerFolders}
                    payload={customizedPayload}
                    onChangePayload={handleChangePayload}
                    toggleEditing={toggleEditing}
                    isLabelMapping={isLabelMapping}
                    folders={folders}
                    labels={labels}
                    importedEmail={importedEmail}
                />
            )}
        </FormModal>
    );
};

export default CustomizeMailImportModal;
