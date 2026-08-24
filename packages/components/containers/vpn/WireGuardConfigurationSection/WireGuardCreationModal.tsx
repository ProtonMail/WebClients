import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import Form from '../../../components/form/Form';
import QRCode from '../../../components/image/QRCode';
import Loader from '../../../components/loader/Loader';
import type { ModalProps } from '../../../components/modalTwo/Modal';
import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import { Tabs } from '../../../components/tabs/Tabs';
import TextAreaTwo from '../../../components/v2/input/TextArea';

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
                                        <TextAreaTwo className="block mt-2" value={config} readOnly rows={14} />
                                    </div>
                                ),
                            },
                            {
                                title: c('Title').t`QR Code`,
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
