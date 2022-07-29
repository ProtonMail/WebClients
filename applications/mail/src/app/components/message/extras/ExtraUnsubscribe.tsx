import { c } from 'ttag';

import {
    Button,
    Field,
    Href,
    Icon,
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    Row,
    Tooltip,
    generateUID,
    useAddresses,
    useApi,
    useEventManager,
    useLoading,
    useModalState,
    useNotifications,
} from '@proton/components';
import { markAsUnsubscribed, oneClickUnsubscribe } from '@proton/shared/lib/api/messages';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { canonizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { getOriginalTo, isUnsubscribed } from '@proton/shared/lib/mail/messages';
import isTruthy from '@proton/utils/isTruthy';

import { useOnCompose } from '../../../containers/ComposeProvider';
import { findSender } from '../../../helpers/addresses';
import { useSendMessage } from '../../../hooks/composer/useSendMessage';
import { useSendVerifications } from '../../../hooks/composer/useSendVerifications';
import { useGetMessage } from '../../../hooks/message/useMessage';
import { useSaveDraft } from '../../../hooks/message/useSaveDraft';
import { MessageState, MessageStateWithData, PartialMessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
}

const ExtraUnsubscribe = ({ message }: Props) => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const { call } = useEventManager();
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

    const [unsubscribeModalProps, setUnsubscribeModalOpen] = useModalState();

    if (!Object.keys(unsubscribeMethods).length || !address) {
        return null;
    }

    const messageID = message?.data?.ID;

    let modalContent;
    let submit: () => void;

    if (unsubscribeMethods.OneClick) {
        modalContent = (
            <>
                {c('Info')
                    .t`A request to unsubscribe from this mailing list will be sent to the sender of the newsletter and automatically processed.`}
                <br />
                <Href href={getKnowledgeBaseUrl('/avoid-spam')}>{c('Link').t`Learn more`}</Href>
            </>
        );

        submit = async () => {
            // TS guard - To impprove
            if (!messageID) {
                return;
            }
            await api(oneClickUnsubscribe(messageID));
        };
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

        modalContent = (
            <>
                {c('Info')
                    .jt`To unsubscribe from this mailing list, an email will be sent from ${boldFrom} with following details as defined by the sender of the newsletter:`}
                <br />
                <Href href={getKnowledgeBaseUrl('/avoid-spam')}>{c('Link').t`Learn more`}</Href>
                <Row className="mt1">
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
            </>
        );

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

        submit = async () => {
            const { cleanMessage, mapSendPrefs } = await sendVerification(inputMessage as MessageStateWithData, {});
            await saveDraft(cleanMessage);
            const message = getMessage(cleanMessage.localID) as MessageStateWithData;
            cleanMessage.data = message.data;
            await sendMessage({ inputMessage: cleanMessage, mapSendPrefs, onCompose });
        };
    } else if (unsubscribeMethods.HttpClient) {
        modalContent = (
            <>
                {c('Info')
                    .jt`To unsubscribe from this mailing list, you will be taken to the following URL where instructions will be provided by the sender of the newsletter:`}
                <br />
                <Href href={getKnowledgeBaseUrl('/avoid-spam')}>{c('Link').t`Learn more`}</Href>
                <div className="text-bold rounded border p1 bg-weak text-break mb1 mt1">{c('Info')
                    .t`URL: ${unsubscribeMethods.HttpClient}`}</div>
            </>
        );

        submit = () => {
            if (unsubscribeMethods.HttpClient) {
                openNewTab(unsubscribeMethods.HttpClient);
            }
        };
    }

    const handleSubmit = async () => {
        if (!messageID) {
            return;
        }

        unsubscribeModalProps.onClose();
        await submit();
        await api(markAsUnsubscribed([messageID]));
        await call();
        createNotification({ text: c('Success').t`Mail list unsubscribed` });
    };

    return (
        <div className="bg-norm rounded border pl0-5 pr0-25 on-mobile-pr0-5 on-mobile-pb0-5 py0-25 mb0-85 flex flex-nowrap on-mobile-flex-column">
            <div className="flex-item-fluid flex flex-nowrap on-mobile-mb0-5">
                <Icon name="envelope" className="mt0-4 flex-item-noshrink ml0-2" />
                <span className="pl0-5 pr0-5 flex flex-item-fluid flex-align-items-center">{c('Status')
                    .t`This message is from a mailing list.`}</span>
            </div>
            <span className="flex-item-noshrink flex-align-items-start flex on-mobile-w100 pt0-1">
                <Tooltip title={c('Info').t`This message is from a mailing list.`}>
                    <Button
                        onClick={() => setUnsubscribeModalOpen(true)}
                        size="small"
                        color="weak"
                        shape="outline"
                        fullWidth
                        className="rounded-sm"
                        data-testid="unsubscribe-banner"
                        disabled={loading || isUnsubscribed(message.data)}
                    >
                        <span className="ml0-5">
                            {isUnsubscribed(message.data)
                                ? c('Status').t`Unsubscribed`
                                : loading
                                ? c('Action').t`Unsubscribing`
                                : c('Action').t`Unsubscribe`}
                        </span>
                    </Button>
                </Tooltip>
            </span>

            <ModalTwo className="pm-modal--shorterLabels" {...unsubscribeModalProps}>
                <ModalTwoHeader title={c('Title').t`Unsubscribe`} />
                <ModalTwoContent>{modalContent}</ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={unsubscribeModalProps.onClose}>{c('Action').t`Cancel`}</Button>
                    <PrimaryButton
                        onClick={() => withLoading(handleSubmit())}
                        data-testid="unsubscribe-banner:submit"
                    >{c('Action').t`Unsubscribe`}</PrimaryButton>
                </ModalTwoFooter>
            </ModalTwo>
        </div>
    );
};

export default ExtraUnsubscribe;
