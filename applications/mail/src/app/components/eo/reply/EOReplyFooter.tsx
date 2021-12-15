import { Button } from '@proton/components';
import { c } from 'ttag';
import { useHistory } from 'react-router';
import AttachmentsButton from '../../attachment/AttachmentsButton';

interface Props {
    id: string;
    onAddAttachments: (files: File[]) => void;
}

const EOReplyFooter = ({ id, onAddAttachments }: Props) => {
    const history = useHistory();

    const handleCancel = () => {
        history.push(`/eo/message/${id}`);
    };

    return (
        <div className="flex flex-justify-space-between">
            <Button size="large" color="weak" type="button" onClick={handleCancel}>
                {c('Action').t`Cancel`}
            </Button>
            <div className="flex">
                <AttachmentsButton
                    onAddAttachments={onAddAttachments}
                    data-testid="eo-composer:attachment-button"
                />
                <Button className="ml1" size="large" color="norm" type="button" onClick={() => console.log('SEND')}>
                    {c('Action').t`Send`}
                </Button>
            </div>
        </div>
    );
};

export default EOReplyFooter;
