import { c } from 'ttag';

import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useNotifications from '@proton/components/hooks/useNotifications';
import { Copy } from '@proton/components/index';
import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';

import { contextTotal, elementsLength, params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

interface Props extends ModalProps {}

export const DebugMailStoreContextTotal = ({ ...rest }: Props) => {
    const storeParams = useMailSelector(params);
    const total = useMailSelector(contextTotal);
    const length = useMailSelector(elementsLength);

    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();

    const { createNotification } = useNotifications();

    const data = {
        params: storeParams,
        contextTotal: total,
        elementsLength: length,
        counts: {
            conversations: conversationCounts,
            messages: messageCounts,
        },
    };

    const stringData = JSON.stringify(data, null, 2);

    return (
        <ModalTwo {...rest} onClose={rest.onClose} size="large">
            <ModalTwoHeader title="Mail debugging information" />
            <ModalTwoContent className="bg-weak m-0 px-8 py-2">
                <pre className="text-sm ">{stringData}</pre>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Copy
                    tooltipText={c('Info').t`Copy to clipboard`}
                    value={stringData}
                    onCopy={() => {
                        createNotification({ text: c('Info').t`Copied to clipboard` });
                    }}
                >{c('Action').t`Copy`}</Copy>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
