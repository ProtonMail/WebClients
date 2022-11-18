import { useEffect, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { Button } from '@proton/atoms';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { Address } from '@proton/shared/lib/interfaces';
import {
    CustomFieldsBitmap,
    IMPORT_ERROR,
    ImportedMailFolder,
    MailImportPayloadError,
    MailImporterPayload,
    OAUTH_PROVIDER,
    TIME_PERIOD,
} from '@proton/shared/lib/interfaces/EasySwitch';

import { Alert, Icon, InlineLinkButton, LabelStack, TextLoader, Tooltip } from '../../../../../components';
import { useFolders, useLabels, useModals, useUser } from '../../../../../hooks';
import { IMAPS, getTimeUnitLabels } from '../../../constants';
import useIAMailPayload from '../../../hooks/useIAMailPayload';
import { ImportMailModalModel } from '../../interfaces';
import CustomizeMailImportModal from '../CustomizeMailImportModal';

interface Props {
    modalModel: ImportMailModalModel;
    updateModalModel: (newModel: ImportMailModalModel) => void;
    addresses: Address[];
}

const { FOLDER_NAMES_TOO_LONG, LABEL_NAMES_TOO_LONG, UNAVAILABLE_NAMES, MAX_FOLDERS_LIMIT_REACHED, RESERVED_NAMES } =
    MailImportPayloadError;

const ImportPrepareStep = ({ modalModel, updateModalModel, addresses }: Props) => {
    const timeUnitLabels = getTimeUnitLabels();
    const availableAddresses = addresses.filter((addr) => addr.Receive && addr.Send && addr.Keys.some((k) => k.Active));

    const initialModel = useRef<ImportMailModalModel>();
    const [user, userLoading] = useUser();
    const { createModal } = useModals();
    const { providerFolders, password } = modalModel;

    const [folders = [], foldersLoading] = useFolders();
    const [labels = [], labelsLoading] = useLabels();

    const isLabelMapping = modalModel.imap === IMAPS[OAUTH_PROVIDER.GOOGLE];

    const { payload, selectedPeriod } = modalModel;

    const { getMailMappingErrors, getDefaultMapping, getDefaultLabel } = useIAMailPayload({
        email: modalModel.email,
        providerFolders,
        isLabelMapping,
    });

    const selectedFolders = useMemo(
        () =>
            payload.Mapping.filter((m) => m.checked).map(
                (mappedFolder) =>
                    providerFolders.find((p) => p.Source === mappedFolder.Source) || ({} as ImportedMailFolder)
            ),
        [payload.Mapping, providerFolders]
    );

    const providerFoldersNum = useMemo(() => providerFolders.length, [providerFolders]);
    const providerFoldersNumLocalized = providerFoldersNum.toLocaleString();
    const selectedFoldersCountLocalized = selectedFolders.length.toLocaleString();

    const importSize = useMemo(() => selectedFolders.reduce((acc, { Size = 0 }) => acc + Size, 0), [selectedFolders]);

    const showSizeWarning = useMemo(
        () => importSize + user.UsedSpace >= user.MaxSpace * 2,
        [importSize, user.UsedSpace, user.MaxSpace]
    );

    const mappingErrors = useMemo(() => getMailMappingErrors(payload.Mapping), [payload.Mapping]);

    const showMaxFoldersError = mappingErrors.includes(MAX_FOLDERS_LIMIT_REACHED);
    const showUnavailableNamesError = mappingErrors.includes(UNAVAILABLE_NAMES);
    const showFoldersNameTooLongError = mappingErrors.includes(FOLDER_NAMES_TOO_LONG);
    const showLabelsNameTooLongError = mappingErrors.includes(LABEL_NAMES_TOO_LONG);
    const showReservedNamesError = mappingErrors.includes(RESERVED_NAMES);

    const hasError =
        showMaxFoldersError ||
        showFoldersNameTooLongError ||
        showLabelsNameTooLongError ||
        showUnavailableNamesError ||
        showReservedNamesError;

    const handleUpdateModel = (selectedPeriod: TIME_PERIOD, payload: MailImporterPayload) => {
        updateModalModel({
            ...modalModel,
            selectedPeriod,
            payload,
        });
    };

    const handleClickCustomize = () => {
        createModal(
            <CustomizeMailImportModal
                addresses={availableAddresses}
                customizeFoldersOpen={hasError}
                isLabelMapping={isLabelMapping}
                folders={folders}
                labels={labels}
                importedEmail={modalModel.email}
                providerFolders={providerFolders}
                payload={payload}
                updateModel={handleUpdateModel}
                selectedPeriod={selectedPeriod}
            />
        );
    };

    const handleReset = () => {
        if (!initialModel.current) {
            return;
        }

        updateModalModel(initialModel.current);
    };

    const [isCustom, setIsCustom] = useState(false);

    // Update CustomFields
    useEffect(() => {
        if (!initialModel.current) {
            return;
        }

        const { StartTime, ImportLabel, Mapping } = initialModel.current.payload;

        const isCustomPeriod = StartTime !== payload.StartTime;
        const isCustomLabel = !isDeepEqual(ImportLabel, payload.ImportLabel);
        const isCustomMapping = !isDeepEqual(Mapping, payload.Mapping);

        let CustomFields = 0;

        if (isCustomMapping) {
            CustomFields += CustomFieldsBitmap.Mapping;
        }
        if (isCustomLabel) {
            CustomFields += CustomFieldsBitmap.Label;
        }
        if (isCustomPeriod) {
            CustomFields += CustomFieldsBitmap.Period;
        }

        setIsCustom(isCustomPeriod || isCustomLabel || isCustomMapping);

        updateModalModel({
            ...modalModel,
            payload: {
                ...modalModel.payload,
                CustomFields,
            },
        });
    }, [payload.StartTime, payload.ImportLabel, payload.Mapping]);

    useEffect(() => {
        updateModalModel({
            ...modalModel,
            isPayloadInvalid: hasError,
        });
    }, [hasError]);

    useEffect(() => {
        if (!modalModel.importID) {
            return;
        }

        const newModel = {
            ...modalModel,
            payload: {
                ...modalModel.payload,
                Code: password,
                Mapping: getDefaultMapping(),
                ImportLabel: getDefaultLabel(),
            },
        };

        initialModel.current = newModel;

        updateModalModel(newModel);
    }, [modalModel.importID]);

    if (modalModel.errorCode === IMPORT_ERROR.IMAP_CONNECTION_ERROR) {
        return (
            <div className="p1 text-center w100 color-danger">
                <Icon name="exclamation-circle" size={60} />
                <div className="mt0-5 mlauto mrauto mb0-5 max-w30e">
                    {c('Error').t`We were unable to connect to your service provider.`}
                    <br />
                    {c('Error').t`Please try to reauthenticate and make sure the permissions are set correctly.`}
                </div>
            </div>
        );
    }

    if (!modalModel.importID || foldersLoading || userLoading || labelsLoading) {
        return (
            <div className="p1 text-center w100">
                <CircleLoader size="large" />
                <TextLoader>{c('Loading info').t`Connecting to your email provider`}</TextLoader>
            </div>
        );
    }

    const addressToDisplay = addresses.find((addr) => addr.ID === modalModel.payload.AddressID);

    const emailFrom = modalModel.email;
    const emailTo = addressToDisplay?.Email;

    const importedEmailAddress = <strong key="importedEmailAddress">{emailFrom}</strong>;
    const PMEmailAddress = <strong key="PMEmailAddress">{emailTo}</strong>;

    const from = c('Label').jt`From: ${importedEmailAddress}`;
    const to = c('Label').jt`To: ${PMEmailAddress}`;
    const fromLabel = c('Label').t`From: ${emailFrom}`;
    const toLabel = c('Label').t`To: ${emailTo}`;

    return (
        <>
            {showSizeWarning ? (
                <Alert className="mb1 mt1" type="warning">
                    <div className="mb1">
                        {c('Warning')
                            .t`This import may exceed the storage capacity currently available in your ${BRAND_NAME} account. Please consider customizing your import.`}
                    </div>

                    <div>
                        {c('Warning')
                            .t`${BRAND_NAME} will transfer as much data as possible, starting with your most recent messages.`}
                    </div>
                </Alert>
            ) : (
                <div>
                    {c('Warning')
                        .t`${BRAND_NAME} will transfer as much data as possible, starting with your most recent messages.`}
                </div>
            )}

            {showMaxFoldersError && (
                <Alert className="mb1 mt1" type="error">
                    {c('Error')
                        .t`There are too many folders in your external account. Please customize the import to delete some folders.`}
                </Alert>
            )}

            {(showFoldersNameTooLongError || showLabelsNameTooLongError) && (
                <Alert className="mb1 mt1" type="error">
                    {isLabelMapping
                        ? c('Error')
                              .t`Some of your label names exceed ${MAIL_APP_NAME}'s maximum character limit. Please customize the import to edit these names.`
                        : c('Error')
                              .t`Some of your folder names exceed ${MAIL_APP_NAME}'s maximum character limit. Please customize the import to edit these names.`}
                </Alert>
            )}

            {showUnavailableNamesError && (
                <Alert className="mb1 mt1" type="error">
                    {isLabelMapping
                        ? c('Error')
                              .t`Some of your label names are unavailable. Please customize the import to edit these names.`
                        : c('Error')
                              .t`Some of your folder names are unavailable. Please customize the import to edit these names.`}
                </Alert>
            )}

            {showReservedNamesError && (
                <Alert className="mb1 mt1" type="error">
                    {isLabelMapping
                        ? c('Error').t`The label name is invalid. Please choose a different name.`
                        : c('Error').t`The folder name is invalid. Please choose a different name.`}
                </Alert>
            )}

            <div className="flex pb1 mb1 border-bottom">
                <div className="flex-item-fluid text-ellipsis mr0-5" title={fromLabel}>
                    {from}
                </div>
                <div className="flex-item-fluid text-ellipsis ml0-5 text-right" title={toLabel}>
                    {to}
                </div>
            </div>

            <div className="pb1 mb1 border-bottom">
                <div className="mb1 flex flex-align-items-center">
                    <Icon className="mr0-5" name="inbox" />
                    {c('Info').t`Import mailbox`}
                </div>

                <div className="mb1 ml1 flex flex-align-items-center">
                    <Icon className="mr0-5" name="clock" />
                    {c('Label').t`Import interval`}
                    {`: `}
                    <strong className="ml0-5">{timeUnitLabels[selectedPeriod]}</strong>
                </div>

                <div className="mb1 ml1 flex flex-align-items-center flex-nowrap">
                    <Icon className="flex-item-noshrink mr0-5" name="tag" />
                    <span className="flex-item-noshrink">{c('Info').t`Label all imported messages as`}</span>
                    {payload.ImportLabel && payload.ImportLabel.Name && (
                        <span className="ml0-5">
                            <LabelStack
                                labels={[
                                    {
                                        name: payload.ImportLabel.Name,
                                        color: payload.ImportLabel.Color,
                                        title: payload.ImportLabel.Name,
                                    },
                                ]}
                                className="max-w100"
                            />
                        </span>
                    )}
                </div>

                <div className="mb1 ml1 flex flex-align-items-center">
                    <Icon className="mr0-5" name={isLabelMapping ? 'tags' : 'folders'} />
                    {isLabelMapping
                        ? c('Info').ngettext(
                              msgid`${providerFoldersNumLocalized} label found in Gmail`,
                              `${providerFoldersNumLocalized} labels found in Gmail`,
                              providerFoldersNum
                          )
                        : c('Info').ngettext(
                              msgid`${providerFoldersNumLocalized} folder found`,
                              `${providerFoldersNumLocalized} folders found`,
                              providerFoldersNum
                          )}

                    {showMaxFoldersError && (
                        <Tooltip
                            title={
                                isLabelMapping
                                    ? c('Tooltip').t`Customize import to reduce the number of labels`
                                    : c('Tooltip').t`Customize import to reduce the number of folders`
                            }
                            originalPlacement="right"
                        >
                            <Icon className="ml0-5 color-danger" name="exclamation-circle-filled" size={18} />
                        </Tooltip>
                    )}
                </div>

                {selectedFolders.length !== providerFoldersNum && (
                    <div className="mb1 ml2 flex flex-align-items-center">
                        <strong>
                            <Icon className="mr0-5" name={isLabelMapping ? 'tags' : 'folders'} />
                            {isLabelMapping
                                ? c('Info').ngettext(
                                      msgid`${selectedFoldersCountLocalized} label selected`,
                                      `${selectedFoldersCountLocalized} labels selected`,
                                      selectedFolders.length
                                  )
                                : c('Info').ngettext(
                                      msgid`${selectedFoldersCountLocalized} folder selected`,
                                      `${selectedFoldersCountLocalized} folders selected`,
                                      selectedFolders.length
                                  )}
                        </strong>
                    </div>
                )}

                <div className="mt0-5 flex flex-align-items-center">
                    <Button shape="outline" onClick={handleClickCustomize}>
                        {c('Action').t`Customize import`}
                    </Button>
                    {(showFoldersNameTooLongError ||
                        showLabelsNameTooLongError ||
                        showUnavailableNamesError ||
                        showReservedNamesError) && (
                        <Tooltip
                            title={
                                isLabelMapping ? c('Tooltip').t`Edit label names` : c('Tooltip').t`Edit folder names`
                            }
                            originalPlacement="right"
                        >
                            <Icon name="exclamation-circle-filled" size={20} className="ml0-5 color-danger" />
                        </Tooltip>
                    )}
                    {isCustom && (
                        <InlineLinkButton className="ml1" onClick={handleReset}>
                            {c('Action').t`Reset to default`}
                        </InlineLinkButton>
                    )}
                </div>
            </div>
        </>
    );
};

export default ImportPrepareStep;
