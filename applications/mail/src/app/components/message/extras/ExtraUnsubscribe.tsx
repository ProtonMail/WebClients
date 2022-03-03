import { canonizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getOriginalTo, isUnsubscribed } from '@proton/shared/lib/mail/messages';
import {
    Icon,
    Alert,
    ConfirmModal,
    Tooltip,
    Button,
    generateUID,
    useNotifications,
    useAddresses,
    useLoading,
    useModals,
    useApi,
    useEventManager,
    Label,
    Field,
    Row,
} from '@proton/components';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { oneClickUnsubscribe, markAsUnsubscribed } from '@proton/shared/lib/api/messages';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { useSaveDraft } from '../../../hooks/message/useSaveDraft';
import { useSendMessage } from '../../../hooks/composer/useSendMessage';
import { findSender } from '../../../helpers/addresses';
import { useSendVerifications } from '../../../hooks/composer/useSendVerifications';
import { useOnCompose } from '../../../containers/ComposeProvider';
import { MessageState, MessageStateWithData, PartialMessageState } from '../../../logic/messages/messagesTypes';
import { useGetMessage } from '../../../hooks/message/useMessage';

interface Props {
    message: MessageState;
}

const ExtraUnsubscribe = ({ message }: Props) => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const [addresses] = useAddresses();
    const { extendedVerifications: sendVerification } = useSendVerifications();
    const saveDraft = useSaveDraft();
    const getMessage = useGetMessage();
    const sendMessage = useSendMessage();
    const [loading, withLoading] = useLoading();
    const onCompose = useOnCompose();
    const toAddress = getOriginalTo(message.data);
    const address = addresses.find(({ Email }) => canonizeInternalEmail(Email) === canonizeInternalEmail(toAddress));
    const unsubscribeMethods = message?.data?.UnsubscribeMethods || {};

    if (!Object.keys(unsubscribeMethods).length || !address) {
        return null;
    }

    const messageID = message?.data?.ID;

    const handleClick = async () => {
        if (unsubscribeMethods.OneClick) {
            await new Promise<void>((resolve, reject) => {
                createModal(
                    <ConfirmModal
                        title={c('Title').t`Unsubscribe`}
                        onConfirm={resolve}
                        onClose={reject}
                        confirm={c('Action').t`Unsubscribe`}
                        small={false}
                        className="pm-modal--shorterLabels"
                    >
                        <Alert
                            className="mb1"
                            type="warning"
                            learnMore="https://protonmail.com/support/knowledge-base/avoid-spam/"
                        >
                            {c('Info')
                                .t`A request to unsubscribe from this mailing list will be sent to the sender of the newsletter and automatically processed.`}
                        </Alert>
                    </ConfirmModal>
                );
            });
            await api(oneClickUnsubscribe(messageID));
        } else if (unsubscribeMethods.Mailto) {
            const { Subject = 'Unsubscribe', Body = 'Please, unsubscribe me', ToList = [] } = unsubscribeMethods.Mailto;
            // "address" by default, but will default to another address if this address cant send message
            const from = findSender(addresses, { AddressID: address.ID }, true);

            if (!from) {
                throw new Error('Unable to find from address');
            }

            const { DisplayName: senderName, Email: senderAddress } = from;
            const sender = [senderName, senderName ? `<${senderAddress}>` : senderAddress].filter(isTruthy).join(' '); // senderName can be undefined
            const boldFrom = <strong key="email">{sender}</strong>;
            const toEmails = ToList.join(', ');

            await new Promise<void>((resolve, reject) => {
                createModal(
                    <ConfirmModal
                        title={c('Title').t`Unsubscribe`}
                        onConfirm={resolve}
                        onClose={reject}
                        confirm={c('Action').t`Unsubscribe`}
                        small={false}
                        className="pm-modal--shorterLabels"
                    >
                        <Alert
                            className="mb1"
                            type="warning"
                            learnMore="https://protonmail.com/support/knowledge-base/avoid-spam/"
                        >
                            {c('Info')
                                .jt`To unsubscribe from this mailing list, an email will be sent from ${boldFrom} with following details as defined by the sender of the newsletter:`}
                        </Alert>
                        <Row>
                            <Label className="cursor-default">
                                <span className="mr0-5">{c('Info').t`Recipient: `}</span>
                            </Label>
                            <Field className="border bg-weak">
                                <div className="pl1 pr1 pt0-5 pb0-5 text-ellipsis" title={toEmails}>
                                    {toEmails}
                                </div>
                            </Field>
                        </Row>
                        <Row>
                            <Label className="cursor-default">
                                <span className="mr0-5">{c('Info').t`Subject: `}</span>
                            </Label>
                            <Field className="border bg-weak">
                                <div className="pl1 pr1 pt0-5 pb0-5 text-ellipsis" title={Subject}>
                                    {Subject}
                                </div>
                            </Field>
                        </Row>
                        <Row>
                            <Label className="cursor-default">
                                <span className="mr0-5">{c('Info').t`Body: `}</span>
                            </Label>
                            <Field className="border bg-weak">
                                <div className="pl1 pr1 pt0-5 pb0-5 text-ellipsis" title={Body}>
                                    {Body}
                                </div>
                            </Field>
                        </Row>
                    </ConfirmModal>
                );
            });

            const inputMessage: PartialMessageState = {
                localID: generateUID('unsubscribe'),
                draftFlags: { autoSaveContacts: 0 }, // Unsubscribe request should not save "to" address in contact list
                messageDocument: { plainText: Body },
                data: {
                    AddressID: from.ID,
                    Subject,
                    Sender: { Address: senderAddress, Name: senderName },
                    ToList: ToList.map((email: string) => ({
                        Address: email,
                        Name: email,
                    })),
                    CCList: [],
                    BCCList: [],
                    MIMEType: MIME_TYPES.PLAINTEXT,
                    Attachments: [],
                },
            };

            const { cleanMessage, mapSendPrefs } = await sendVerification(inputMessage as MessageStateWithData, {});
            await saveDraft(cleanMessage);
            const message = getMessage(cleanMessage.localID) as MessageStateWithData;
            cleanMessage.data = message.data;
            await sendMessage({ inputMessage: cleanMessage, mapSendPrefs, onCompose });
        } else if (unsubscribeMethods.HttpClient) {
            await new Promise<void>((resolve, reject) => {
                createModal(
                    <ConfirmModal
                        title={c('Title').t`Unsubscribe`}
                        onConfirm={resolve}
                        onClose={reject}
                        confirm={c('Action').t`Unsubscribe`}
                        small={false}
                        className="pm-modal--shorterLabels"
                    >
                        <Alert
                            className="mb1"
                            type="warning"
                            learnMore="https://protonmail.com/support/knowledge-base/avoid-spam/"
                        >
                            {c('Info')
                                .jt`To unsubscribe from this mailing list, you will be taken to the following URL where instructions will be provided by the sender of the newsletter:`}
                        </Alert>
                        <div className="text-bold rounded border p1 bg-weak text-break mb1">{c('Info')
                            .t`URL: ${unsubscribeMethods.HttpClient}`}</div>
                    </ConfirmModal>
                );
            });
            openNewTab(unsubscribeMethods.HttpClient);
        }
        await api(markAsUnsubscribed([messageID]));
        await call();
        createNotification({ text: c('Success').t`Mail list unsubscribed` });
    };

    return (
        <Tooltip title={c('Info').t`This message is from a mailing list.`}>
            <Button
                onClick={() => withLoading(handleClick())}
                size="small"
                className="inline-flex flex-align-items-center on-mobile-w100 on-mobile-flex-justify-center mr0-5 mb0-5 py0-25"
                data-testid="unsubscribe-banner"
            >
                <Icon name="envelope" className="flex-item-noshrink" />
                <span className="ml0-5">
                    {isUnsubscribed(message.data)
                        ? c('Status').t`Unsubscribed from mailing list`
                        : loading
                        ? c('Status').t`Unsubscribing from mailing list...`
                        : loading
                        ? c('Action').t`Unsubscribing`
                        : c('Action').t`Unsubscribe from mailing list`}
                </span>
            </Button>
        </Tooltip>
    );
};

export default ExtraUnsubscribe;
