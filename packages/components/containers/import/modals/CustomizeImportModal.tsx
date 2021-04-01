import React, { useState, ChangeEvent, useMemo } from 'react';
import { subYears, subMonths } from 'date-fns';
import { c, msgid } from 'ttag';

import { noop } from 'proton-shared/lib/helpers/function';
import { Address } from 'proton-shared/lib/interfaces';
import { Folder } from 'proton-shared/lib/interfaces/Folder';
import { Label } from 'proton-shared/lib/interfaces/Label';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';

import EditLabelModal from '../../labels/modals/EditLabelModal';

import { useModals } from '../../../hooks';
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
    PrimaryButton,
    Button,
    ErrorButton,
    Label as FormLabel,
} from '../../../components';

import { ImportModalModel, ImportPayloadModel, TIME_UNIT } from '../interfaces';
import { timeUnitLabels } from '../constants';
import ImportManageFolders from './ImportManageFolders';
import { mappingHasFoldersTooLong, mappingHasLabelsTooLong, mappingHasUnavailableNames } from '../helpers';

interface Props {
    modalModel: ImportModalModel;
    updateModalModel: (newModel: ImportModalModel) => void;
    address: Address;
    onClose?: () => void;
    customizeFoldersOpen: boolean;
    isLabelMapping: boolean;
    folders: Folder[];
    labels: Label[];
}

const CustomizeImportModal = ({
    modalModel,
    updateModalModel,
    address,
    onClose = noop,
    customizeFoldersOpen = false,
    isLabelMapping,
    folders,
    labels,
    ...rest
}: Props) => {
    const initialPayload = modalModel.payload;
    const [customizedPayload, setCustomizedPayload] = useState<ImportPayloadModel>({ ...initialPayload });
    const [selectedPeriod, setSelectedPeriod] = useState<TIME_UNIT>(modalModel.selectedPeriod);
    const [organizeFolderVisible, setOrganizeFolderVisible] = useState(customizeFoldersOpen);
    const { createModal } = useModals();
    const [isEditing, setIsEditing] = useState(false);

    const hasUnavailableNamesError = useMemo(
        () => mappingHasUnavailableNames(customizedPayload.Mapping, isLabelMapping ? folders : labels, isLabelMapping),
        [customizedPayload.Mapping, folders, labels]
    );
    const hasFoldersTooLongError = useMemo(() => mappingHasFoldersTooLong(customizedPayload.Mapping), [
        customizedPayload.Mapping,
    ]);
    const hasLabelsTooLongError = useMemo(() => mappingHasLabelsTooLong(customizedPayload.Mapping), [
        customizedPayload.Mapping,
    ]);

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

    const handleChangePayload = (newPayload: ImportPayloadModel) => setCustomizedPayload(newPayload);

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
                confirm={<ErrorButton type="submit">{c('Action').t`Quit`}</ErrorButton>}
            >
                <Alert type="error">{c('Warning').t`You will lose any customization you made so far.`}</Alert>
            </ConfirmModal>
        );
    };

    const toggleFolders = () => {
        setOrganizeFolderVisible(!organizeFolderVisible);
    };

    const handleEditLabel = async () => {
        const ImportLabel: Label = await new Promise((resolve, reject) => {
            createModal(
                <EditLabelModal
                    label={customizedPayload.ImportLabel}
                    type="label"
                    onCheckAvailable={resolve as () => undefined}
                    onClose={reject}
                    mode="checkAvailable"
                />
            );
        });

        setCustomizedPayload({ ...customizedPayload, ImportLabel });
    };

    const handleChangePeriod = (selectedPeriod: TIME_UNIT) => {
        const now = new Date();
        let StartTime: Date | undefined;

        switch (selectedPeriod) {
            case TIME_UNIT.LAST_YEAR:
                StartTime = subYears(now, 1);
                break;
            case TIME_UNIT.LAST_3_MONTHS:
                StartTime = subMonths(now, 3);
                break;
            case TIME_UNIT.LAST_MONTH:
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

    const totalFoldersCount = modalModel.providerFolders.length;
    const selectedFoldersCount = customizedPayload.Mapping.length;

    const handleSubmit = () => {
        updateModalModel({
            ...modalModel,
            selectedPeriod,
            payload: customizedPayload,
        });
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
        hasFoldersTooLongError ||
        hasLabelsTooLongError ||
        hasUnavailableNamesError;

    return (
        <FormModal
            title={c('Title').t`Customize import`}
            submit={
                <PrimaryButton disabled={submitDisabled} type="submit">
                    {c('Action').t`Save`}
                </PrimaryButton>
            }
            close={<Button onClick={handleCancel}>{c('Action').t`Cancel`}</Button>}
            onSubmit={handleSubmit}
            onClose={handleCancel}
            className="customize-import-modal"
            {...rest}
        >
            <Alert>
                {isLabelMapping
                    ? c('Info')
                          .t`Create a label for the imported messages, a time range for this import, and the labels you would like to import.`
                    : c('Info')
                          .t`Create a label for the imported messages, a time range for this import, and the folders you would like to import.`}
            </Alert>

            <div className="mb1 pt1 border-bottom flex-align-items-center">
                <Row>
                    <FormLabel className="flex flex-align-items-center">
                        {c('Label').t`Label messages as`}
                        <Tooltip title={c('Tooltip').t`Each imported email will have this label`}>
                            <Icon name="info" className="ml0-5" />
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
                        <Button className="flex-item-noshrink ml1" onClick={handleEditLabel}>
                            {c('Action').t`Edit label`}
                        </Button>
                    </Field>
                </Row>
            </div>

            <div className="mb1 pt1 border-bottom flex-align-items-center">
                <Row>
                    <FormLabel className="flex flex-align-items-center">
                        {c('Label').t`Import messages since`}
                        <Tooltip title={c('Tooltip').t`The import will start with the most recent messages.`}>
                            <Icon name="info" className="ml0-5" />
                        </Tooltip>
                    </FormLabel>
                    <Field>
                        <Select
                            className="flex-item-fluid"
                            onChange={({ target }: ChangeEvent<HTMLSelectElement>) =>
                                handleChangePeriod(target.value as TIME_UNIT)
                            }
                            options={[
                                {
                                    value: TIME_UNIT.BIG_BANG,
                                    text: timeUnitLabels[TIME_UNIT.BIG_BANG],
                                },
                                {
                                    value: TIME_UNIT.LAST_YEAR,
                                    text: timeUnitLabels[TIME_UNIT.LAST_YEAR],
                                },
                                {
                                    value: TIME_UNIT.LAST_3_MONTHS,
                                    text: timeUnitLabels[TIME_UNIT.LAST_3_MONTHS],
                                },
                                {
                                    value: TIME_UNIT.LAST_MONTH,
                                    text: timeUnitLabels[TIME_UNIT.LAST_MONTH],
                                },
                            ]}
                            value={selectedPeriod}
                        />
                    </Field>
                </Row>
            </div>

            <div className="mb1 pt1 flex-align-items-center">
                <Row>
                    <FormLabel>{isLabelMapping ? c('Label').t`Manage labels` : c('Label').t`Manage folders`}</FormLabel>
                    <div className="flex flex-align-items-center">
                        <Icon name={isLabelMapping ? 'folder-label' : 'parent-folder'} className="mr0-5" />
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
                        <Button className="ml2" onClick={toggleFolders}>
                            {toggleActionCopy}
                        </Button>
                    </div>
                </Row>
            </div>

            {organizeFolderVisible && (
                <ImportManageFolders
                    address={address}
                    modalModel={modalModel}
                    payload={customizedPayload}
                    onChangePayload={handleChangePayload}
                    toggleEditing={toggleEditing}
                    isLabelMapping={isLabelMapping}
                    folders={folders}
                    labels={labels}
                />
            )}
        </FormModal>
    );
};

export default CustomizeImportModal;
