import { useState } from 'react';

import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
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
} from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { IssueStatus } from '../../zustand/download/downloadManager.store';

type SignatureIssueModalProps = {
    message: string;
    isFile: boolean;
    downloadName: string;
    apply: (strategy: IssueStatus, all: boolean) => void;
    cancelAll: () => void;
};

export function SignatureIssueModal({
    message,
    isFile,
    downloadName,
    apply,
    cancelAll,
    onClose,
    open,
    onExit,
}: SignatureIssueModalProps & ModalStateProps) {
    const [strategy, setStrategy] = useState(IssueStatus.Rejected);
    const [applyAll, setApplyAll] = useState(false);

    const handleClose = () => {
        cancelAll();
        onClose();
    };

    const renderContent = () => {
        if (!message) {
            return (
                <ModalTwoContent>
                    <Banner variant={BannerVariants.DANGER}>{c('Error')
                        .t`Failed to load signature details, please try again later`}</Banner>
                </ModalTwoContent>
            );
        }

        const downloadFileName = (
            <strong className="text-break" key="downloadFileName">
                {downloadName}
            </strong>
        );

        return (
            <ModalTwoContent>
                <p>
                    {message}{' '}
                    <a href={getKnowledgeBaseUrl('/drive-signature-management')} target="_blank">
                        {c('Action').t`Learn more`}
                    </a>
                </p>
                <p>{c('Info').t`What do you want to do?`}</p>
                <Row>
                    <Radio
                        id={IssueStatus.Rejected}
                        checked={strategy === IssueStatus.Rejected}
                        onChange={() => setStrategy(IssueStatus.Rejected)}
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
                        id={IssueStatus.Approved}
                        checked={strategy === IssueStatus.Approved}
                        onChange={() => setStrategy(IssueStatus.Approved)}
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
                    <Checkbox checked={applyAll} onChange={() => setApplyAll((value) => !value)}>
                        {c('Label').t`Apply to all unverified items`}
                    </Checkbox>
                </Row>
            </ModalTwoContent>
        );
    };

    return (
        <ModalTwo
            as={Form}
            onClose={handleClose}
            onSubmit={() => {
                apply(strategy, applyAll);
                onClose();
            }}
            size="large"
            open={open}
            onExit={onExit}
        >
            <ModalTwoHeader
                title={isFile ? c('Title').t`Download unverified file?` : c('Title').t`Download unverified folder?`}
            />
            {renderContent()}
            <ModalTwoFooter>
                <Button onClick={handleClose}>{c('Action').t`Cancel all downloads`}</Button>
                <Button type="submit" color="norm">
                    {c('Action').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}
