import type { ReactNode } from 'react';
import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import {
    Checkbox,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    Radio,
    Row,
    useModalTwoStatic,
} from '@proton/components';

import { TransferConflictStrategy } from '../../store/_uploads/interface';

export interface ConflictModalProps {
    name: string;
    isFolder?: boolean;
    originalIsDraft?: boolean;
    originalIsFolder?: boolean;
    isForPhotos?: boolean;
    apply: (strategy: TransferConflictStrategy, all: boolean) => void;
    cancelAll: () => void;
    onConfirm?: () => void;
    title?: string;
    children?: ReactNode;
    cancel?: ReactNode;
    confirm?: ReactNode;
    loading?: boolean;
    className?: string;
    small?: boolean;
    tiny?: boolean;
    noTitleEllipsis?: boolean;
    mode?: 'alert';
    submitProps?: any;
    closeProps?: any;
}

export default function ConflictModal({
    name,
    isFolder = false,
    originalIsDraft = false,
    originalIsFolder = false,
    isForPhotos = false,
    apply,
    cancelAll,
    onClose,
    ...modalProps
}: ConflictModalProps & ModalStateProps) {
    const [strategy, setStrategy] = useState(TransferConflictStrategy.Replace);
    const [applyAll, setApplyAll] = useState(false);

    const isSameType = originalIsFolder === isFolder;

    const uploadName = (
        <strong className="text-break" key="filename">
            {name}
        </strong>
    );

    const replaceFile = <strong key="replaceFile">{c('Action').t`Replace file`}</strong>;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        apply(strategy, applyAll);
        onClose();
    };

    const closeAndCancel = () => {
        onClose();
        cancelAll();
    };

    return (
        <ModalTwo as="form" onClose={closeAndCancel} onSubmit={handleSubmit} size="small" {...modalProps}>
            <ModalTwoHeader
                title={
                    isSameType ? (
                        <>{isFolder ? c('Title').t`Duplicate folder found` : c('Title').t`Duplicate file found`}</>
                    ) : (
                        <>{c('Label').t`Duplicate found`}</>
                    )
                }
            />

            <ModalTwoContent>
                <p>
                    {originalIsDraft
                        ? c('Info')
                              .jt`It looks like you recently tried to upload ${uploadName}. If the upload failed, please ${replaceFile}. If the upload is still in progress, replacing it will cancel the ongoing upload.`
                        : c('Info').jt`${uploadName} already exists in this location.`}
                    <br />
                    {c('Info').t`What do you want to do?`}
                </p>
                <Row>
                    <Radio
                        id={TransferConflictStrategy.Replace}
                        checked={strategy === TransferConflictStrategy.Replace}
                        onChange={() => setStrategy(TransferConflictStrategy.Replace)}
                        name="strategy"
                        className="inline-flex flex-nowrap"
                    >
                        <div data-testid="replace-existing">
                            <strong>
                                {originalIsFolder
                                    ? c('Label').t`Replace existing folder`
                                    : c('Label').t`Replace existing file`}
                            </strong>
                            <br />
                            <span className="color-weak">
                                {isSameType && !isForPhotos ? (
                                    <>
                                        {originalIsFolder
                                            ? c('Info').t`This will upload a new version of the folder`
                                            : c('Info').t`This will upload a new version of the file`}
                                    </>
                                ) : (
                                    <>
                                        {originalIsFolder
                                            ? c('Info').t`This will replace the existing folder with the file`
                                            : c('Info').t`This will replace the existing file with the folder`}
                                    </>
                                )}
                            </span>
                        </div>
                    </Radio>
                </Row>
                <Row>
                    <Radio
                        id={TransferConflictStrategy.Rename}
                        checked={strategy === TransferConflictStrategy.Rename}
                        onChange={() => setStrategy(TransferConflictStrategy.Rename)}
                        name="strategy"
                        className="inline-flex flex-nowrap"
                    >
                        <div data-testid="keep-both">
                            <strong>
                                {isSameType ? (
                                    <>
                                        {originalIsFolder
                                            ? c('Label').t`Keep both folders`
                                            : c('Label').t`Keep both files`}
                                    </>
                                ) : (
                                    <>{c('Label').t`Keep both`}</>
                                )}
                            </strong>
                            <br />
                            <span className="color-weak">
                                {isFolder
                                    ? c('Info').t`A number will be added to the folder name`
                                    : c('Info').t`A number will be added to the filename`}
                            </span>
                        </div>
                    </Radio>
                </Row>
                <Row>
                    <Radio
                        id={TransferConflictStrategy.Skip}
                        checked={strategy === TransferConflictStrategy.Skip}
                        onChange={() => setStrategy(TransferConflictStrategy.Skip)}
                        name="strategy"
                        className="inline-flex flex-nowrap"
                    >
                        <div data-testid="skip-upload">
                            <strong>{isFolder ? c('Label').t`Skip folder` : c('Label').t`Skip file`}</strong>
                            <br />
                            <span className="color-weak">
                                {isFolder
                                    ? c('Info').t`Folder will not be uploaded`
                                    : c('Info').t`File will not be updated`}
                            </span>
                        </div>
                    </Radio>
                </Row>
                <hr />
                <Row>
                    <Checkbox data-testid="apply-to-all" onChange={() => setApplyAll((value) => !value)}>
                        {isFolder
                            ? c('Label').t`Apply to all duplicated folders`
                            : c('Label').t`Apply to all duplicated files`}
                    </Checkbox>
                </Row>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={closeAndCancel}>
                    {c('Action').t`Cancel all uploads`}
                </Button>
                <PrimaryButton type="submit">{c('Action').t`Continue`}</PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
}

export const useConflictModal = () => {
    return useModalTwoStatic(ConflictModal);
};
