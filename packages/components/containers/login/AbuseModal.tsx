import { c } from 'ttag';
import { AlertModal, Button, Href } from '../../components';

interface Props {
    message?: string;
    open: boolean;
    onClose: () => void;
}

const AbuseModal = ({ message, open, onClose }: Props) => {
    const contactLink = (
        <Href url="https://protonmail.com/abuse" key={1}>
            {c('Info').t`here`}
        </Href>
    );

    return (
        <AlertModal
            open={open}
            title={c('Title').t`Account suspended`}
            onClose={onClose}
            buttons={<Button onClick={onClose}>{c('Action').t`Close`}</Button>}
        >
            {message || (
                <>
                    <div className="mb1">{c('Info')
                        .t`This account has been suspended due to a potential policy violation.`}</div>
                    <div>{c('Info').jt`If you believe this is in error, please contact us ${contactLink}.`}</div>
                </>
            )}
        </AlertModal>
    );
};

export default AbuseModal;
