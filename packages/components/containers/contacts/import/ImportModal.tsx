import React, { ChangeEvent, useState, DragEvent } from 'react';
import { c } from 'ttag';

import { extractVcards, readVcf } from 'proton-shared/lib/contacts/vcard';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import { noop } from 'proton-shared/lib/helpers/function';
import { MAX_IMPORT_CONTACTS, MAX_IMPORT_FILE_SIZE } from 'proton-shared/lib/contacts/constants';
import { prepare, readCsv, toVcardContacts } from 'proton-shared/lib/contacts/helpers/csv';
import {
    getHasPreVcardsContacts,
    getImportCategoriesModel,
    getIsAcceptedExtension,
    getSupportedContacts,
    haveCategories,
    splitErrors,
} from 'proton-shared/lib/contacts/helpers/import';
import {
    EXTENSION,
    IMPORT_GROUPS_ACTION,
    IMPORT_STEPS,
    ImportContactsModel,
    ImportedContact,
} from 'proton-shared/lib/interfaces/contacts/Import';
import { ImportFatalError } from 'proton-shared/lib/contacts/errors/ImportFatalError';
import { IMPORT_ERROR_TYPE, ImportFileError } from 'proton-shared/lib/contacts/errors/ImportFileError';
import { submitCategories } from './encryptAndSubmit';

import { useApi, useEventManager, useFeature } from '../../../hooks';
import { FormModal, onlyDragFiles, PrimaryButton } from '../../../components';
import { useGetContactGroups } from '../../../hooks/useCategories';

import { FeatureCode } from '../../features';

import AttachingModalContent from './AttachingModalContent';
import ImportCsvModalContent from './ImportCsvModalContent';
import ImportGroupsModalContent from './ImportGroupsModalContent';
import ImportingModalContent from './ImportingModalContent';
import WarningModalContent from './WarningModalContent';
import ImportSummaryModalContent from './ImportSummaryModalContent';

const { CSV, VCF } = EXTENSION;

const getInitialState = (): ImportContactsModel => ({
    step: IMPORT_STEPS.ATTACHING,
    parsedVcardContacts: [],
    importedContacts: [],
    totalEncrypted: 0,
    totalImported: 0,
    errors: [],
    categories: [],
    loading: false,
});

interface Props {
    onClose?: () => void;
}
const ImportModal = ({ ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [model, setModel] = useState<ImportContactsModel>(getInitialState());
    const [isDropzoneHovered, setIsDropzoneHovered] = useState(false);
    const { feature: featureUsedContactsImport, update: updateUsedContactsImport } = useFeature(
        FeatureCode.UsedContactsImport
    );
    const getContactGroups = useGetContactGroups();

    const { content, ...modalProps } = (() => {
        if (model.step <= IMPORT_STEPS.ATTACHED) {
            const submit = (
                <PrimaryButton disabled={model.step === IMPORT_STEPS.ATTACHING} loading={model.loading} type="submit">
                    {c('Action').t`Import`}
                </PrimaryButton>
            );

            const handleClear = () => {
                setModel(getInitialState());
            };

            const handleHover = (hover: boolean) =>
                onlyDragFiles((event: DragEvent) => {
                    setIsDropzoneHovered(hover);
                    event.stopPropagation();
                });

            const handleFiles = (files: File[]) => {
                const [fileAttached] = files;
                const filename = fileAttached.name;
                const [, ext] = splitExtension(filename);
                const extension = ext.toLowerCase();

                if (!fileAttached.size) {
                    throw new ImportFileError(IMPORT_ERROR_TYPE.FILE_EMPTY, filename);
                }
                if (!getIsAcceptedExtension(extension) || !fileAttached) {
                    throw new ImportFileError(IMPORT_ERROR_TYPE.NO_CSV_OR_VCF_FILE, filename);
                }
                if (fileAttached.size > MAX_IMPORT_FILE_SIZE) {
                    throw new ImportFileError(IMPORT_ERROR_TYPE.FILE_TOO_BIG, filename);
                }
                setModel({ ...model, step: IMPORT_STEPS.ATTACHED, fileAttached, extension, failure: undefined });
            };

            const onAddFiles = (files: File[]) => {
                try {
                    if (!files) {
                        throw new ImportFileError(IMPORT_ERROR_TYPE.NO_FILE_SELECTED);
                    }

                    handleFiles(files);
                } catch (e) {
                    setModel({ ...model, failure: e });
                }
            };

            const handleDrop = onlyDragFiles((event: DragEvent) => {
                event.preventDefault();
                setIsDropzoneHovered(false);
                onAddFiles([...event.dataTransfer.files]);
            });

            const handleAttach = ({ target }: ChangeEvent<HTMLInputElement>) => {
                try {
                    if (!target.files) {
                        throw new ImportFileError(IMPORT_ERROR_TYPE.NO_FILE_SELECTED);
                    }
                    handleFiles([...target.files]);
                } catch (e) {
                    setModel({ ...model, failure: e });
                }
            };

            const handleSubmit = async () => {
                const { fileAttached, extension } = model;
                if (!fileAttached) {
                    throw new Error('No file');
                }
                try {
                    setModel({ ...model, loading: true });
                    if (extension === CSV) {
                        const parsedCsvContacts = await readCsv(fileAttached);
                        const preVcardsContacts = prepare(parsedCsvContacts);
                        if (!preVcardsContacts.length) {
                            throw new ImportFileError(IMPORT_ERROR_TYPE.NO_CONTACTS, fileAttached.name);
                        }
                        if (preVcardsContacts.length > MAX_IMPORT_CONTACTS) {
                            throw new ImportFileError(IMPORT_ERROR_TYPE.TOO_MANY_CONTACTS, fileAttached.name);
                        }
                        setModel({
                            ...model,
                            step: IMPORT_STEPS.IMPORT_CSV,
                            preVcardsContacts,
                            failure: undefined,
                            loading: false,
                        });
                    } else if (extension === VCF) {
                        const vcards = extractVcards(await readVcf(fileAttached));
                        if (vcards.length > MAX_IMPORT_CONTACTS) {
                            throw new ImportFileError(IMPORT_ERROR_TYPE.TOO_MANY_CONTACTS, fileAttached.name);
                        }
                        const { errors, rest: parsedVcardContacts } = splitErrors(getSupportedContacts(vcards));
                        const step =
                            errors.length || !parsedVcardContacts.length
                                ? IMPORT_STEPS.WARNING
                                : IMPORT_STEPS.IMPORTING;
                        setModel({
                            ...model,
                            step,
                            parsedVcardContacts,
                            errors,
                            failure: undefined,
                            loading: false,
                        });
                    } else {
                        throw new ImportFileError(IMPORT_ERROR_TYPE.NO_CSV_OR_VCF_FILE);
                    }
                    if (featureUsedContactsImport?.Value === false) {
                        updateUsedContactsImport(true);
                    }
                } catch (e) {
                    const failure = e instanceof ImportFileError ? e : new ImportFatalError(e);
                    setModel({
                        ...getInitialState(),
                        failure,
                    });
                }
            };

            return {
                content: (
                    <AttachingModalContent
                        model={model}
                        onAttach={handleAttach}
                        onClear={handleClear}
                        isDropzoneHovered={isDropzoneHovered}
                        onDrop={handleDrop}
                        onDragEnter={handleHover(true)}
                        onDragLeave={handleHover(false)}
                    />
                ),
                submit,
                onSubmit: handleSubmit,
            };
        }

        if (model.step === IMPORT_STEPS.IMPORT_CSV) {
            const submit = (
                <PrimaryButton disabled={!model.preVcardsContacts?.length} type="submit">
                    {c('Action').t`Import`}
                </PrimaryButton>
            );

            const handleSubmit = () => {
                setModel({
                    ...model,
                    step: IMPORT_STEPS.IMPORTING,
                    parsedVcardContacts: toVcardContacts(model.preVcardsContacts || []),
                    errors: [],
                });
            };

            if (!getHasPreVcardsContacts(model)) {
                throw new ImportFatalError(new Error('No CSV contacts found'));
            }

            return {
                content: <ImportCsvModalContent model={model} setModel={setModel} />,
                submit,
                onSubmit: handleSubmit,
            };
        }

        if (model.step <= IMPORT_STEPS.WARNING) {
            const submit = (
                <PrimaryButton disabled={!model.parsedVcardContacts?.length} type="submit">
                    {c('Action').t`Import`}
                </PrimaryButton>
            );

            const handleSubmit = () => {
                setModel({ ...model, step: IMPORT_STEPS.IMPORTING, errors: [] });
            };

            return {
                title: c('Title').t`Warning`,
                content: <WarningModalContent model={model} />,
                submit,
                onSubmit: handleSubmit,
            };
        }

        if (model.step === IMPORT_STEPS.IMPORTING) {
            const submit = (
                <PrimaryButton disabled type="submit">
                    {c('Action').t`Continue`}
                </PrimaryButton>
            );

            const handleFinish = async (importedContacts: ImportedContact[]) => {
                setModel((model) => ({ ...model, importedContacts, step: IMPORT_STEPS.SUMMARY }));
                await call();
            };

            return {
                content: <ImportingModalContent model={model} setModel={setModel} onFinish={handleFinish} />,
                submit,
                onSubmit: noop,
            };
        }

        if (model.step === IMPORT_STEPS.SUMMARY) {
            const canImportGroups = haveCategories(model.importedContacts);
            const submit = (
                <PrimaryButton type="submit" loading={model.loading}>
                    {canImportGroups ? c('Action').t`Next` : c('Action').t`Close`}
                </PrimaryButton>
            );
            const handleSubmit = async () => {
                if (canImportGroups) {
                    setModel((model) => ({ ...model, loading: true }));
                    const contactGroups = await getContactGroups();
                    setModel((model) => ({
                        ...model,
                        step: IMPORT_STEPS.IMPORT_GROUPS,
                        loading: false,
                        contactGroups,
                        categories: getImportCategoriesModel(model.importedContacts, contactGroups),
                    }));
                } else {
                    rest.onClose?.();
                }
            };

            return {
                content: <ImportSummaryModalContent model={model} />,
                submit,
                close: canImportGroups ? c('Action').t`Close` : null,
                onSubmit: handleSubmit,
            };
        }

        // model.step === IMPORT_STEPS.IMPORT_GROUPS at this stage
        const cannotSave = model.categories.some(
            ({ error, action, targetName }) => !!error || (action === IMPORT_GROUPS_ACTION.CREATE && !targetName)
        );
        const handleSubmit = async () => {
            setModel((model) => ({ ...model, loading: true }));
            await submitCategories(model.categories, api);
            await call();
            setModel((model) => ({ ...model, loading: false }));
            rest.onClose?.();
        };
        const submit = (
            <PrimaryButton type="submit" disabled={cannotSave} loading={model.loading}>
                {c('Action').t`Save`}
            </PrimaryButton>
        );

        return {
            title: c('Title').t`Import groups`,
            content: <ImportGroupsModalContent model={model} setModel={setModel} />,
            submit,
            onSubmit: handleSubmit,
        };
    })();

    return (
        <FormModal title={c('Title').t`Import contacts`} {...modalProps} {...rest}>
            {content}
        </FormModal>
    );
};

export default ImportModal;
