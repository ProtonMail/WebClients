import { ChangeEvent, Dispatch, DragEvent, FormEvent, SetStateAction, useState } from 'react';

import { c, msgid } from 'ttag';

import {
    MAX_IMPORT_CONTACTS,
    MAX_IMPORT_CONTACTS_STRING,
    MAX_IMPORT_FILE_SIZE,
    MAX_IMPORT_FILE_SIZE_STRING,
} from '@proton/shared/lib/contacts/constants';
import { ImportFatalError } from '@proton/shared/lib/contacts/errors/ImportFatalError';
import { IMPORT_ERROR_TYPE, ImportFileError } from '@proton/shared/lib/contacts/errors/ImportFileError';
import { prepare, readCsv } from '@proton/shared/lib/contacts/helpers/csv';
import { getIsAcceptedExtension, getSupportedContacts, splitErrors } from '@proton/shared/lib/contacts/helpers/import';
import { extractVcards, readVcf } from '@proton/shared/lib/contacts/vcard';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { EXTENSION, IMPORT_STEPS, ImportContactsModel } from '@proton/shared/lib/interfaces/contacts/Import';

import {
    Alert,
    AttachedFile,
    Bordered,
    Button,
    Dropzone,
    FileInput,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    onlyDragFiles,
} from '../../../../components';
import { classnames } from '../../../../helpers';
import { useFeature } from '../../../../hooks';
import { FeatureCode } from '../../../features';
import { getInitialState } from '../ContactImportModal';

const { CSV, VCF } = EXTENSION;

interface Props {
    model: ImportContactsModel;
    setModel: Dispatch<SetStateAction<ImportContactsModel>>;
    onClose?: () => void;
}
const ContactImportAttaching = ({ model, setModel, onClose }: Props) => {
    const [isDropzoneHovered, setIsDropzoneHovered] = useState(false);

    const { feature: featureUsedContactsImport, update: updateUsedContactsImport } = useFeature(
        FeatureCode.UsedContactsImport
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
        } catch (e: any) {
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
        } catch (e: any) {
            setModel({ ...model, failure: e });
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        event.stopPropagation();

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
                    errors.length || !parsedVcardContacts.length ? IMPORT_STEPS.WARNING : IMPORT_STEPS.IMPORTING;
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
                void updateUsedContactsImport(true);
            }
        } catch (e: any) {
            const failure = e instanceof ImportFileError ? e : new ImportFatalError(e);
            setModel({
                ...getInitialState(),
                failure,
            });
        }
    };

    const alert = model.failure ? (
        <Alert className="mb1" type="error">
            {model.failure?.message}
        </Alert>
    ) : (
        <Alert className="mb1" learnMore={getKnowledgeBaseUrl('/adding-contacts')}>
            {c('Description').ngettext(
                msgid`The file should have a maximum size of ${MAX_IMPORT_FILE_SIZE_STRING} and have up to ${MAX_IMPORT_CONTACTS_STRING} contact. If your file is bigger, please split it into smaller files.`,
                `The file should have a maximum size of ${MAX_IMPORT_FILE_SIZE_STRING} and have up to ${MAX_IMPORT_CONTACTS_STRING} contacts. If your file is bigger, please split it into smaller files.`,
                MAX_IMPORT_CONTACTS
            )}
        </Alert>
    );

    return (
        <form className="modal-two-dialog-container h100" onSubmit={handleSubmit}>
            <ModalTwoHeader title={c('Title').t`Import contacts`} />
            <ModalTwoContent>
                {alert}
                <Bordered className={classnames(['flex relative', !!model.failure && 'border-danger'])}>
                    {model.fileAttached ? (
                        <AttachedFile
                            file={model.fileAttached}
                            iconName="users"
                            clear={c('Action').t`Delete`}
                            onClear={handleClear}
                        />
                    ) : (
                        <Dropzone
                            isHovered={isDropzoneHovered}
                            onDrop={handleDrop}
                            onDragEnter={handleHover(true)}
                            onDragLeave={handleHover(false)}
                            className="w100"
                        >
                            <FileInput accept=".csv, .vcf" id="import-contacts" onChange={handleAttach}>
                                {c('Action').t`Choose a file or drag it here`}
                            </FileInput>
                        </Dropzone>
                    )}
                </Bordered>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    disabled={model.step === IMPORT_STEPS.ATTACHING}
                    loading={model.loading}
                    type="submit"
                >
                    {c('Action').t`Import`}
                </Button>
            </ModalTwoFooter>
        </form>
    );
};

export default ContactImportAttaching;
