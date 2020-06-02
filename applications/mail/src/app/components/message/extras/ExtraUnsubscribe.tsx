import React from 'react';
import {
    Icon,
    Href,
    Alert,
    ConfirmModal,
    InlineLinkButton,
    generateUID,
    useNotifications,
    useAddresses,
    useLoading,
    useModals
} from 'react-components';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { openNewTab } from 'proton-shared/lib/helpers/browser';
import performRequest from 'proton-shared/lib/fetch/fetch';

import { getListUnsubscribe, getListUnsubscribePost, getOriginalTo } from '../../../helpers/message/messages';
import { MessageExtended, PartialMessageExtended, MessageExtendedWithData } from '../../../models/message';
import { useMessage } from '../../../hooks/useMessage';
import { useSendMessage, useSendVerifications } from '../../../hooks/useSendMessage';
import { updateMessageCache, useMessageCache } from '../../../containers/MessageProvider';
import { removeEmailAlias } from '../../../helpers/addresses';
import { getSearchParams } from 'proton-shared/lib/helpers/url';

interface Props {
    message: MessageExtended;
}

const UNSUBSCRIBE_ONE_CLICK = 'List-Unsubscribe=One-Click';
const UNSUBSCRIBE_REGEX = /<(.*?)>/g;

const ExtraUnsubscribe = ({ message }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [addresses] = useAddresses();
    const { addAction } = useMessage(message.localID);
    const sendVerification = useSendVerifications();
    const sendMessage = useSendMessage();
    const messageCache = useMessageCache();
    const [loading, withLoading] = useLoading();
    const toAddress = getOriginalTo(message.data);
    const { Address: senderAddress, Name: senderName } = message.data?.Sender || {};
    const list = getListUnsubscribe(message.data);
    const oneClick = getListUnsubscribePost(message.data) === UNSUBSCRIBE_ONE_CLICK;
    const matches = (list.match(UNSUBSCRIBE_REGEX) || []).map((m: string) => m.replace('<', '').replace('>', ''));
    const address = addresses.find(({ Email }) => Email === removeEmailAlias(toAddress));

    if (message.unsubscribed || !list || !address) {
        return null;
    }

    const boldFromEmail = <strong key="email">{senderName || senderAddress}</strong>;

    const handleClick = async () => {
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={c('Title').t`Unsubscribe`}
                    onConfirm={resolve}
                    onClose={reject}
                    confirm={c('Action').t`Unsubscribe`}
                >
                    <Alert type="warning" learnMore="https://protonmail.com/support/knowledge-base/avoid-spam/">
                        {c('Info')
                            .jt`Are you sure you'd like to stop receiving similar messages from ${boldFromEmail}?`}
                    </Alert>
                </ConfirmModal>
            );
        });
        try {
            // We check the first method which is supposed to work
            const [value] = matches;

            if (value.startsWith('mailto:')) {
                const [toAddress, search = ''] = value.replace('mailto:', '').split('?');
                const { subject = 'Unsubscribe', body = 'Please, unsubscribe me' } = getSearchParams(search);

                const inputMessage: PartialMessageExtended = {
                    ParentID: message.data?.ID,
                    localID: generateUID('unsubscribe'),
                    plainText: body,
                    publicKeys: message.publicKeys,
                    privateKeys: message.privateKeys,
                    data: {
                        AddressID: address.ID,
                        Subject: subject,
                        Sender: { Address: address.Email, Name: address.DisplayName },
                        ToList: [{ Address: toAddress, Name: toAddress }],
                        CCList: [],
                        BCCList: [],
                        MIMEType: MIME_TYPES.PLAINTEXT
                    }
                };

                const { cleanMessage, mapSendPrefs } = await sendVerification(inputMessage as MessageExtendedWithData);
                await addAction(() => sendMessage(cleanMessage, mapSendPrefs));
            } else if (value.startsWith('http')) {
                if (oneClick) {
                    // NOTE Exist with MailChimp but has CORS issue
                    const config = {
                        url: value,
                        headers: {},
                        input: 'form',
                        method: 'post',
                        data: {
                            'List-Unsubscribe': 'One-Click'
                        }
                    };

                    await performRequest(config);
                } else {
                    openNewTab(value);
                }
            }
        } finally {
            // Even if the request fail, we need to mark the message as unsubscribed
            updateMessageCache(messageCache, message.localID, { unsubscribed: true });
            createNotification({ text: c('Success').t`Mail list unsubscribed` });
        }
    };

    return (
        <div className="bg-white-dm rounded bordered-container p0-5 mb0-5 flex flex-nowrap">
            <Icon name="email" className="flex-item-noshrink mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{c('Info').t`This message is from a mailing list.`}</span>
            <span className="flex-item-noshrink flex">
                <Href className="mr1 pl0-5 pr0-5" href="https://protonmail.com/support/knowledge-base/auto-unsubscribe">
                    {c('Info').t`Learn more`}
                </Href>
                <InlineLinkButton disabled={loading} className="underline" onClick={() => withLoading(handleClick())}>
                    {loading ? c('Action').t`Unsubscribing` : c('Action').t`Unsubscribe`}
                </InlineLinkButton>
            </span>
        </div>
    );
};

export default ExtraUnsubscribe;
