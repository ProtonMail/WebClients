import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import Loader from '@proton/components/components/loader/Loader';

import type { ModalProps } from '../../../components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, QRCode, Tabs, TextArea } from '../../../components';

export interface WireGuardCreationModalProps extends ModalProps {
    text?: string;
    serverName?: string;
    config?: string;
    onDownload?: () => void;
    onClose?: () => void;
}

const WireGuardCreationModal = ({
    open,
    text,
    serverName,
    config,
    onDownload,
    onClose,
}: WireGuardCreationModalProps) => {
    const [tab, setTab] = useState<number>(0);
    const close = () => {
        onClose?.();
    };

    return (
        <ModalTwo
            as={Form}
            open={open}
            size="large"
            className="contacts-modal"
            onSubmit={() => {
                onDownload?.();
            }}
            onClose={close}
        >
            <ModalTwoHeader title={serverName} />
            <ModalTwoContent>
                {config ? (
                    <Tabs
                        fullWidth
                        value={tab}
                        onChange={setTab}
                        tabs={[
                            {
                                title: c('Title').t`Text`,
                                content: (
                                    <div className="text-center">
                                        <p>{text}</p>
                                        <TextArea className="block mt-2" value={config} readOnly rows={14} />
                                    </div>
                                ),
                            },
                            {
                                title: c('Title').t`QRCode`,
                                content: (
                                    <div className="text-center">
                                        <QRCode value={config} />
                                    </div>
                                ),
                            },
                        ]}
                    />
                ) : (
                    <div className="text-center">
                        <p>{
                            // translator: serverName is code name for a logical server such as NL-FREE#1
                            c('Success notification').t`Creating config file for ${serverName}`
                        }</p>
                        <Loader />
                    </div>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={close}>{c('Action').t`Close`}</Button>
                <Button color="norm" type="submit" loading={!config} disabled={!config}>
                    {c('Action').t`Download`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default WireGuardCreationModal;
