import React, { ReactNode, useState } from 'react';
import { c } from 'ttag';

import {
    Radio,
    Checkbox,
    Row,
    ModalTwoFooter,
    ModalTwoHeader,
    ModalTwoContent,
    ModalTwo,
    Button,
    PrimaryButton,
} from '@proton/components';

import { TransferConflictStrategy } from '../../store/uploads/interface';
import { useModal } from '../../hooks/util/useModal';

export interface ConflictModalProps {
    name: string;
    isFolder?: boolean;
    originalIsFolder?: boolean;
    apply: (strategy: TransferConflictStrategy, all: boolean) => void;
    cancelAll: () => void;
    onClose?: () => void;
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
    originalIsFolder = false,
    apply,
    cancelAll,
    onClose,
    ...rest
}: ConflictModalProps) {
    const [strategy, setStrategy] = useState(
        isFolder ? TransferConflictStrategy.Merge : TransferConflictStrategy.Rename
    );
    const [applyAll, setApplyAll] = useState(false);
    const { isOpen, onClose: handleClose } = useModal(onClose);

    const uploadName = (
        <strong className="text-break" key="filename">
            {name}
        </strong>
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        apply(strategy, applyAll);
        handleClose?.();
    };

    const closeAndCancel = () => {
        handleClose();
        cancelAll();
    };

    return (
        <ModalTwo as="form" onClose={closeAndCancel} onSubmit={handleSubmit} open={isOpen} size="small" {...rest}>
            <ModalTwoHeader
                title={isFolder ? c('Title').t`Duplicate folder found` : c('Title').t`Duplicate file found`}
            />
            <ModalTwoContent>
                <p>
                    {c('Info').jt`${uploadName} already exists in this location.`}
                    <br />
                    {c('Info').t`What do you want to do?`}
                </p>
                {originalIsFolder && (
                    <Row>
                        <Radio
                            id={TransferConflictStrategy.Merge}
                            checked={strategy === TransferConflictStrategy.Merge}
                            onChange={() => setStrategy(TransferConflictStrategy.Merge)}
                            name="strategy"
                            className="inline-flex flex-nowrap"
                        >
                            <div>
                                <strong>{c('Label').t`Merge a folder`}</strong>
                                <br />
                                <span className="color-weak">{c('Info')
                                    .t`Folder contents will merge into a single folder`}</span>
                            </div>
                        </Radio>
                    </Row>
                )}
                <Row>
                    <Radio
                        id={TransferConflictStrategy.Rename}
                        checked={strategy === TransferConflictStrategy.Rename}
                        onChange={() => setStrategy(TransferConflictStrategy.Rename)}
                        name="strategy"
                        className="inline-flex flex-nowrap"
                    >
                        <div>
                            <strong>{c('Label').t`Upload anyway`}</strong>
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
                        id={TransferConflictStrategy.Replace}
                        checked={strategy === TransferConflictStrategy.Replace}
                        onChange={() => setStrategy(TransferConflictStrategy.Replace)}
                        name="strategy"
                        className="inline-flex flex-nowrap"
                    >
                        <div>
                            <strong>
                                {originalIsFolder ? c('Label').t`Replace folder` : c('Label').t`Replace file`}
                            </strong>
                            <br />
                            <span className="color-weak">
                                {originalIsFolder
                                    ? c('Info').t`This will overwrite the existing folder`
                                    : c('Info').t`This will overwrite the existing file`}
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
                        <div>
                            <strong>{isFolder ? c('Label').t`Skip folder` : c('Label').t`Skip file`}</strong>
                            <br />
                            <span className="color-weak">
                                {isFolder
                                    ? c('Info').t`Folder will not be uploaded`
                                    : c('Info').t`File will not be uploaded`}
                            </span>
                        </div>
                    </Radio>
                </Row>
                <hr />
                <Row>
                    <Checkbox onChange={() => setApplyAll((value) => !value)}>
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
                <PrimaryButton type="submit">{c('Action').t`Create`}</PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
}
