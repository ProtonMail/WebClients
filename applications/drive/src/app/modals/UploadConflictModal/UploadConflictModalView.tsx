import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Checkbox, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, Radio, Row } from '@proton/components';
import type { ModalProps } from '@proton/components';
import { NodeType } from '@proton/drive';
import { UploadConflictStrategy, UploadConflictType } from '@proton/drive/modules/upload';

export type UploadConflictModalViewProps = {
    name: string;
    nodeType: NodeType;
    conflictType: UploadConflictType;
    onResolve: (strategy: UploadConflictStrategy, applyAll: boolean) => void;
    onCancelAll: () => void;
};

export function UploadConflictModalView({
    name,
    nodeType,
    conflictType,
    onResolve,
    onCancelAll,
    onClose,
    onExit,
    open,
}: UploadConflictModalViewProps & ModalProps) {
    const [strategy, setStrategy] = useState(UploadConflictStrategy.Replace);
    const [applyAll, setApplyAll] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onResolve(strategy, applyAll);
        onClose?.();
    };

    const isFolder = nodeType === NodeType.Folder;
    const isDraftConflict = conflictType === UploadConflictType.Draft;

    const uploadName = (
        <strong className="text-break" key="filename">
            {name}
        </strong>
    );

    const replaceFile = <strong key="replaceFile">{c('Action').t`Replace file`}</strong>;

    return (
        <ModalTwo
            as="form"
            onClose={() => {
                onCancelAll();
                onClose?.();
            }}
            onExit={onExit}
            open={open}
            onSubmit={handleSubmit}
            size="small"
        >
            <ModalTwoHeader title={c('Label').t`Duplicate found`} />

            <ModalTwoContent>
                <p>
                    {isDraftConflict
                        ? c('Info')
                              .jt`It looks like you recently tried to upload ${uploadName}. If the upload failed, please ${replaceFile}. If the upload is still in progress, replacing it will cancel the ongoing upload.`
                        : c('Info').jt`${uploadName} already exists in this location.`}
                    <br />
                    {c('Info').t`What do you want to do?`}
                </p>
                <Row>
                    <Radio
                        id={UploadConflictStrategy.Replace}
                        checked={strategy === UploadConflictStrategy.Replace}
                        onChange={() => {
                            return setStrategy(UploadConflictStrategy.Replace);
                        }}
                        name="strategy"
                        className="inline-flex flex-nowrap"
                        data-testid={`strategy-${UploadConflictStrategy.Replace}`}
                    >
                        <div data-testid="replace-existing">
                            <strong>{c('Label').t`Replace existing folder or file`}</strong>
                            <br />
                            <span className="color-weak">
                                {isFolder
                                    ? c('Info').t`This will replace the existing folder or file with the folder`
                                    : c('Info').t`This will replace the existing folder or file with the file`}
                            </span>
                        </div>
                    </Radio>
                </Row>
                <Row>
                    <Radio
                        id={UploadConflictStrategy.Rename}
                        checked={strategy === UploadConflictStrategy.Rename}
                        onChange={() => {
                            return setStrategy(UploadConflictStrategy.Rename);
                        }}
                        name="strategy"
                        className="inline-flex flex-nowrap"
                        data-testid={`strategy-${UploadConflictStrategy.Rename}`}
                    >
                        <div data-testid="keep-both">
                            <strong>{c('Label').t`Keep both`}</strong>
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
                        id={UploadConflictStrategy.Skip}
                        checked={strategy === UploadConflictStrategy.Skip}
                        onChange={() => {
                            return setStrategy(UploadConflictStrategy.Skip);
                        }}
                        name="strategy"
                        className="inline-flex flex-nowrap"
                        data-testid={`strategy-${UploadConflictStrategy.Skip}`}
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
                    <Checkbox
                        data-testid="apply-to-all"
                        checked={applyAll}
                        onChange={() => setApplyAll((value) => !value)}
                    >
                        {isFolder
                            ? c('Label').t`Apply to all duplicated folders`
                            : c('Label').t`Apply to all duplicated files`}
                    </Checkbox>
                </Row>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onCancelAll}>
                    {c('Action').t`Cancel all uploads`}
                </Button>
                <Button color="norm" type="submit">
                    {c('Action').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}
