import { useState } from 'react';
import { c } from 'ttag';

import { FormModal, Radio, Checkbox, Row } from '@proton/components';

import { SignatureIssues } from '../store';
import { TransferSignatureIssueStrategy } from '../store/downloads/interface';
import { SignatureAlertBody } from './SignatureAlert';

export interface ConflictModalProps {
    isFile: boolean;
    name: string;
    downloadName: string;
    signatureAddress?: string;
    signatureIssues: SignatureIssues;
    apply: (strategy: TransferSignatureIssueStrategy, all: boolean) => void;
    cancelAll: () => void;
    onClose?: () => void;
}

export default function SignatureIssueModal({
    isFile,
    name,
    downloadName,
    signatureAddress,
    signatureIssues,
    apply,
    cancelAll,
    onClose,
    ...rest
}: ConflictModalProps) {
    const [strategy, setStrategy] = useState(TransferSignatureIssueStrategy.Abort);
    const [applyAll, setApplyAll] = useState(false);

    const downloadFileName = (
        <strong className="text-break" key="downloadFileName">
            {downloadName}
        </strong>
    );

    return (
        <FormModal
            onClose={() => {
                cancelAll();
                onClose?.();
            }}
            onSubmit={() => {
                apply(strategy, applyAll);
                onClose?.();
            }}
            title={isFile ? c('Title').t`Download unverified file?` : c('Title').t`Download unverified folder?`}
            close={c('Action').t`Cancel all downloads`}
            submit={c('Action').t`Continue`}
            small
            {...rest}
        >
            <p>
                <SignatureAlertBody
                    signatureIssues={signatureIssues}
                    signatureAddress={signatureAddress}
                    isFile={isFile}
                    name={name}
                />
            </p>
            <p>{c('Info').t`What do you want to do?`}</p>
            <Row>
                <Radio
                    id={TransferSignatureIssueStrategy.Abort}
                    checked={strategy === TransferSignatureIssueStrategy.Abort}
                    onChange={() => setStrategy(TransferSignatureIssueStrategy.Abort)}
                    name="strategy"
                    className="inline-flex flex-nowrap"
                >
                    <div>
                        <strong>{c('Label').t`Cancel download`}</strong>
                        <br />
                        <span className="color-weak">
                            {c('Info').jt`Download of ${downloadFileName} will be aborted`}
                        </span>
                    </div>
                </Radio>
            </Row>
            <Row>
                <Radio
                    id={TransferSignatureIssueStrategy.Continue}
                    checked={strategy === TransferSignatureIssueStrategy.Continue}
                    onChange={() => setStrategy(TransferSignatureIssueStrategy.Continue)}
                    name="strategy"
                    className="inline-flex flex-nowrap"
                >
                    <div>
                        <strong>{c('Label').t`Download anyway`}</strong>
                        <br />
                        <span className="color-weak">{c('Info').t`Signature check will be ignored`}</span>
                    </div>
                </Radio>
            </Row>
            <hr />
            <Row>
                <Checkbox onChange={() => setApplyAll((value) => !value)}>
                    {c('Label').t`Apply to all unverified items`}
                </Checkbox>
            </Row>
        </FormModal>
    );
}
