import React, { useMemo, useEffect, useRef, useState } from 'react';
import { format, isValid } from 'date-fns';
import { c, msgid } from 'ttag';

import { Address } from 'proton-shared/lib/interfaces';
import { LABEL_COLORS, LABEL_TYPE } from 'proton-shared/lib/constants';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';

import { useFolders, useUser, useModals } from '../../../../../hooks';
import {
    Icon,
    LabelStack,
    Button,
    Alert,
    Tooltip,
    InlineLinkButton,
    FullLoader,
    TextLoader,
} from '../../../../../components';
import { ImportModalModel, MailImportFolder, DestinationFolder, IMPORT_ERROR } from '../../interfaces';
import { timeUnitLabels } from '../../constants';
import { escapeSlashes, splitEscaped } from '../../helpers';

import CustomizeImportModal from '../CustomizeImportModal';

interface Props {
    modalModel: ImportModalModel;
    updateModalModel: (newModel: ImportModalModel) => void;
    addresses: Address[];
}

enum CustomFieldsBitmap {
    Mapping = 1,
    Label = 2,
    Period = 4,
}

const ImportPrepareStep = ({ modalModel, updateModalModel, addresses }: Props) => {
    const availableAddresses = addresses.filter((addr) => addr.Receive && addr.Send && addr.Keys.some((k) => k.Active));

    const initialModel = useRef<ImportModalModel>(modalModel);
    const [user, userLoading] = useUser();
    const { createModal } = useModals();
    const { providerFolders, password } = modalModel;
    const [folders = [], foldersLoading] = useFolders();

    const { payload, selectedPeriod } = modalModel;

    const providerFoldersNum = useMemo(() => {
        return providerFolders.length;
    }, [providerFolders]);
    const providerFoldersNumLocalized = providerFoldersNum.toLocaleString();

    const selectedFolders = useMemo(
        () =>
            payload.Mapping.filter((m) => m.checked).map(
                (mappedFolder) =>
                    providerFolders.find((p) => p.Source === mappedFolder.Source) || ({} as MailImportFolder)
            ),
        [payload.Mapping, providerFolders]
    );

    const selectedFoldersCountLocalized = selectedFolders.length.toLocaleString();

    const importSize = useMemo(() => selectedFolders.reduce((acc, { Size = 0 }) => acc + Size, 0), [selectedFolders]);

    const showSizeWarning = useMemo(() => importSize + user.UsedSpace >= user.MaxSpace * 2, [
        importSize,
        user.UsedSpace,
        user.MaxSpace,
    ]);

    const showFoldersNumError = useMemo(() => selectedFolders.length + folders.length >= 500, [
        selectedFolders,
        folders,
    ]);

    const showFoldersNameError = useMemo(() => {
        return payload.Mapping.some((m) => {
            const splitted = splitEscaped(m.Destinations.FolderPath);
            return m.checked && splitted[splitted.length - 1].length >= 100;
        });
    }, [payload.Mapping]);

    const handleClickCustomize = () => {
        createModal(
            <CustomizeImportModal
                addresses={availableAddresses}
                modalModel={modalModel}
                updateModalModel={updateModalModel}
                customizeFoldersOpen={showFoldersNumError || showFoldersNameError}
            />
        );
    };

    const handleReset = () => {
        updateModalModel(initialModel.current);
    };

    const [isCustom, setIsCustom] = useState(false);

    // Update CustomFields for tracking
    useEffect(() => {
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
        updateModalModel({ ...modalModel, isPayloadInvalid: showFoldersNumError || showFoldersNameError });
    }, [showFoldersNumError, showFoldersNameError]);

    const getParentSource = (folderPath: string, separator: string) => {
        const split = splitEscaped(folderPath, separator);

        let parentName = '';

        while (split.length && !parentName) {
            split.pop();
            const parent = providerFolders.find((f) => f.Source === split.join(separator));
            if (parent) {
                parentName = parent.Source;
            }
        }

        return parentName;
    };

    const getFolderName = (folderPath: string, separator: string) => {
        const parentSource = getParentSource(folderPath, separator);

        return parentSource
            ? escapeSlashes(folderPath.replace(`${parentSource}${separator}`, ''))
            : escapeSlashes(folderPath);
    };

    const getDestinationFolderPath = ({ Source, Separator }: MailImportFolder) => {
        const folderName = getFolderName(Source, Separator);
        const systemFolders = Object.values(DestinationFolder) as string[];

        let parentSource = getParentSource(Source, Separator);
        let pathParts = [folderName];

        while (parentSource) {
            if (!systemFolders.includes(parentSource)) {
                pathParts = [getFolderName(parentSource, Separator), ...pathParts];
            } else {
                pathParts[0] = `[${parentSource}]${pathParts[0]}`;
            }

            parentSource = getParentSource(parentSource, Separator);
        }

        if (pathParts.length > 2) {
            const [firstLevel, secondLevel, ...rest] = pathParts;
            return [firstLevel, secondLevel, escapeSlashes(rest.join('/'))].join('/');
        }

        return pathParts.join('/');
    };

    useEffect(() => {
        if (!modalModel.importID) {
            return;
        }
        const Mapping = providerFolders.map((folder) => ({
            Source: folder.Source,
            Destinations: {
                FolderPath: folder.DestinationFolder || getDestinationFolderPath(folder),
            },
            checked: true,
        }));

        const ImportLabel = {
            Name: `${modalModel.email.split('@')[1]} ${format(new Date(), 'dd-MM-yyyy HH:mm')}`,
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            Type: LABEL_TYPE.MESSAGE_LABEL,
            Order: 0,
        };

        const newModel = {
            ...modalModel,
            payload: {
                ...modalModel.payload,
                Code: password,
                Mapping,
                ImportLabel,
            },
        };

        updateModalModel(newModel);
        if (initialModel) {
            initialModel.current = newModel;
        }
    }, [modalModel.importID]);

    if (modalModel.errorCode === IMPORT_ERROR.IMAP_CONNECTION_ERROR) {
        return (
            <div className="p1 text-center w100 color-danger">
                <Icon name="attention" size={60} />
                <div className="mt0-5 mlauto mrauto mb0-5 max-w30e">
                    {c('Error').t`We were unable to connect to your service provider.`}
                    <br />
                    {c('Error').t`Please try to reauthenticate and make sure the permissions are set correctly.`}
                </div>
            </div>
        );
    }

    if (!modalModel.importID || foldersLoading || userLoading) {
        return (
            <div className="p1 text-center w100">
                <FullLoader size={100} />
                <TextLoader>{c('Loading info').t`Connecting to your mailbox`}</TextLoader>
            </div>
        );
    }

    const addressToDisplay = addresses.find((addr) => addr.ID === modalModel.payload.AddressID);

    return (
        <>
            <Alert type={showSizeWarning ? 'warning' : 'info'} className="mt1 mb1">
                {showSizeWarning && (
                    <div className="mb1">
                        {c('Warning')
                            .t`This import may exceed the storage capacity currently available in your Proton account. Please consider customizing your import.`}
                    </div>
                )}
                {c('Warning')
                    .t`Proton will transfer as much data as possible, starting with your most recent messages.`}
            </Alert>

            {showFoldersNumError && (
                <Alert type="error" className="mt1 mb1">
                    {c('Error')
                        .t`There are too many folders in your external account. Please customize the import to delete some folders.`}
                </Alert>
            )}

            {showFoldersNameError && (
                <Alert type="error" className="mt1 mb1">
                    {c('Error')
                        .t`Some of your folder names exceed ProtonMail's maximum character limit. Please customize the import to edit these names.`}
                </Alert>
            )}

            <div className="flex pb1 mb1 border-bottom">
                <div className="flex-item-fluid text-ellipsis mr0-5">
                    <span>{c('Label').t`From`}</span>
                    {`: `}
                    <strong>{modalModel.email}</strong>
                </div>
                <div className="flex-item-fluid text-ellipsis ml0-5 text-right">
                    <span>{c('Label').t`To`}</span>
                    {`: `}
                    <strong>{addressToDisplay?.Email}</strong>
                </div>
            </div>

            <div className="pb1 mb1 border-bottom">
                <div className="mb1 flex flex-align-items-center">
                    <Icon className="mr0-5" name="mailbox" />
                    {c('Info').t`Import mailbox`}
                </div>

                <div className="mb1 ml1 flex flex-align-items-center">
                    <Icon className="mr0-5" name="parent-folder" />
                    {c('Info').ngettext(
                        msgid`${providerFoldersNumLocalized} folder found`,
                        `${providerFoldersNumLocalized} folders found`,
                        providerFoldersNum
                    )}

                    {showFoldersNumError && (
                        <Tooltip
                            title={c('Tooltip').t`Customize import to reduce the number of folders`}
                            originalPlacement="right"
                        >
                            <Icon name="attention-plain" size={18} />
                        </Tooltip>
                    )}
                </div>

                {selectedFolders.length !== providerFoldersNum && (
                    <div className="mb1 ml2 flex flex-align-items-center">
                        <strong>
                            <Icon className="mr0-5" name="parent-folder" />
                            {c('Info').ngettext(
                                msgid`${selectedFoldersCountLocalized} folder selected`,
                                `${selectedFoldersCountLocalized} folders selected`,
                                selectedFolders.length
                            )}
                        </strong>
                    </div>
                )}

                <div className="mb1 ml1 flex flex-align-items-center">
                    <Icon className="mr0-5" name="clock" />
                    {c('Label').t`Import interval`}
                    {`: `}
                    <strong className="ml0-5">{timeUnitLabels[selectedPeriod]}</strong>
                </div>

                <div className="mb1 ml1 flex flex-align-items-center flex-nowrap">
                    <Icon className="flex-item-noshrink mr0-5" name="label" />
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

                <div className="mt0-5 flex flex-align-items-center">
                    <Button shape="outline" onClick={handleClickCustomize}>
                        {c('Action').t`Customize import`}
                    </Button>
                    {showFoldersNameError && (
                        <Tooltip title={c('Tooltip').t`Edit folder names`} originalPlacement="right">
                            <Icon name="attention-plain" size={20} className="ml0-5" />
                        </Tooltip>
                    )}
                    {isCustom && isValid && (
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
