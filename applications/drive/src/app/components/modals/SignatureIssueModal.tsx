import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import {
    Checkbox,
    Form,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Radio,
    Row,
    useModalTwoStatic,
} from '@proton/components';

import { TransferSignatureIssueStrategy } from '../../store/_downloads/interface';
import type { SignatureIssues } from '../../store/_links/interface';
import { SignatureAlertBody } from '../SignatureAlert';

interface ConflictModalProps {
    isFile: boolean;
    name: string;
    downloadName: string;
    signatureAddress?: string;
    signatureIssues: SignatureIssues;
    apply: (strategy: TransferSignatureIssueStrategy, all: boolean) => void;
    cancelAll: () => void;
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
    ...modalProps
}: ConflictModalProps & ModalStateProps) {
    const [strategy, setStrategy] = useState(TransferSignatureIssueStrategy.Abort);
    const [applyAll, setApplyAll] = useState(false);

    const handleClose = () => {
        cancelAll();
        onClose();
    };

    const downloadFileName = (
        <strong className="text-break" key="downloadFileName">
            {downloadName}
        </strong>
    );

    return (
        <ModalTwo
            as={Form}
            onClose={handleClose}
            onSubmit={() => {
                apply(strategy, applyAll);
                onClose();
            }}
            size="small"
            {...modalProps}
        >
            <ModalTwoHeader
                title={isFile ? c('Title').t`Download unverified file?` : c('Title').t`Download unverified folder?`}
            />
            <ModalTwoContent>
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
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={handleClose}>{c('Action').t`Cancel all downloads`}</Button>
                <Button type="submit" color="norm">
                    {c('Action').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}

export const useSignatureIssueModal = () => {
    return useModalTwoStatic(SignatureIssueModal);
};
