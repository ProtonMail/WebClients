import { Icon } from '@proton/components';
import { c } from 'ttag';
import { ReactNode } from 'react';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
    type: string;
    onLoadImages: () => void;
    button?: ReactNode;
}

const ExtraImagesLoader = ({ message, type, onLoadImages, button }: Props) => {

    const { showRemoteImages = true, showEmbeddedImages = true } = message.messageImages || {};

    if (type === 'embedded' && showEmbeddedImages !== false) {
        return null;
    }

    if (type === 'remote' && showRemoteImages !== false) {
        return null;
    }

    const defaultButton = <button
        type="button"
        onClick={onLoadImages}
        className="text-underline link"
        data-testid="remote-content:load2"
    >{c('Action').t`Load`}</button>;

    const loadButton = button || defaultButton;

    return (
        <div className="bg-norm rounded bordered p0-5 mb0-5 flex flex-nowrap">
            <Icon name="image" className="mtauto mbauto"/>
            <span className="pl0-5 pr0-5 flex-item-fluid">
                {type === 'remote'
                    ? c('Action').t`This message contains remote content.`
                    : c('Action').t`This message contains embedded images.`}
            </span>
            {loadButton}
        </div>
    );
};

export default ExtraImagesLoader;
