import { c } from 'ttag';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { PublicKeyReference, CryptoProxy } from '@proton/crypto';
import { KEY_FILE_EXTENSION } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';
import {
    Form,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    Button,
} from '../../../components';
import { useLoading } from '../../../hooks';

const handleExport = async (name: string, publicKey: PublicKeyReference) => {
    const fingerprint = publicKey.getFingerprint();
    const filename = ['publickey.', name, '-', fingerprint, KEY_FILE_EXTENSION].join('');
    const armoredPublicKey = await CryptoProxy.exportPublicKey({ key: publicKey });
    const blob = new Blob([armoredPublicKey], { type: 'text/plain' });
    downloadFile(blob, filename);
};

interface Props extends ModalProps {
    name: string;
    fallbackPrivateKey: string;
    publicKey?: PublicKeyReference;
    onSuccess?: () => void;
}

const ExportPublicKeyModal = ({ name, fallbackPrivateKey, publicKey, onClose, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();

    const handleSubmit = async () => {
        if (publicKey) {
            await handleExport(name, publicKey);
        } else {
            // If there is no publicKey, it means the private key couldn't be decrypted, so just use whatever was received from the server
            const fallbackPublicKey = await CryptoProxy.importPublicKey({ armoredKey: fallbackPrivateKey });
            await handleExport(name, fallbackPublicKey);
        }
        onClose?.();
    };

    const handleClose = loading ? noop : onClose;

    return (
        <Modal
            as={Form}
            onSubmit={() => {
                void withLoading(handleSubmit());
            }}
            onClose={handleClose}
            {...rest}
        >
            <ModalHeader title={c('Title').t`Export public key`} />
            <ModalContent>
                <div>
                    {c('Info')
                        .t`Give your public key to your friends, or publish it online, so that everyone can send you end-to-end encrypted email!`}
                </div>
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>

                <Button loading={loading} type="submit" color="norm">
                    {c('Action').t`Export`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ExportPublicKeyModal;
