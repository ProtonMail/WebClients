import { c } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';
import {
    Field,
    Icon,
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    Prompt,
    Row,
    Tooltip,
    generateUID,
    useAddresses,
    useApi,
    useEventManager,
    useModalState,
    useNotifications,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { markAsUnsubscribed, oneClickUnsubscribe } from '@proton/shared/lib/api/messages';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { AUTO_SAVE_CONTACTS } from '@proton/shared/lib/mail/mailSettings';
import { getOriginalTo, hasProtonSender, hasSimpleLoginSender, isUnsubscribed } from '@proton/shared/lib/mail/messages';
import isTruthy from '@proton/utils/isTruthy';

import { useOnCompose } from '../../../containers/ComposeProvider';
import { findSender } from '../../../helpers/message/messageRecipients';
import { useSendMessage } from '../../../hooks/composer/useSendMessage';
import { useSendVerifications } from '../../../hooks/composer/useSendVerifications';
import { useGetMessage } from '../../../hooks/message/useMessage';
import { useSaveDraft } from '../../../hooks/message/useSaveDraft';
import type {
    MessageStateWithData,
    MessageWithOptionalBody,
    PartialMessageState,
} from '../../../store/messages/messagesTypes';
import ProtonPassAliasesModal from '../../protonPass/ProtonPassAliasesModal';

interface Props {
    message: MessageWithOptionalBody;
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
    const toAddress = getOriginalTo(message);
    const address = addresses?.find(
        ({ Email }) => canonicalizeInternalEmail(Email) === canonicalizeInternalEmail(toAddress)
    );

    const unsubscribeMethods = message.UnsubscribeMethods || {};

    const [unsubscribeModalProps, setUnsubscribeModalOpen, renderUnsubscribeModal] = useModalState();
    const [unsubscribedModalProps, setUnsubscribedModalOpen, renderUnsubscribedModal] = useModalState();
    const [passAliasesModalProps, setPassAliasesModalOpen, renderPassAliasesModal] = useModalState();

    if (!Object.keys(unsubscribeMethods).length || !address) {
        return null;
    }

    const messageID = message.ID;

    let modalContent;
    let submit: () => void;

    if (unsubscribeMethods.OneClick) {
        modalContent = (
            <>
                {c('Info')
                    .t`A request to unsubscribe from this mailing list will be sent to the sender of the newsletter and automatically processed.`}
                <br />
                <Href href={getKnowledgeBaseUrl('/auto-unsubscribe')}>{c('Link').t`Learn more`}</Href>
            </>
        );

        submit = async () => {
            await api(oneClickUnsubscribe(messageID));
        };
    } else if (unsubscribeMethods.HttpClient) {
        modalContent = (
            <>
                {c('Info')
                    .jt`To unsubscribe from this mailing list, you will be taken to the following URL where instructions will be provided by the sender of the newsletter:`}
                <br />
                <Href href={getKnowledgeBaseUrl('/avoid-spam')}>{c('Link').t`Learn more`}</Href>
                <div className="text-bold rounded border p-4 bg-weak text-break my-4">{c('Info')
                    .t`URL: ${unsubscribeMethods.HttpClient}`}</div>
            </>
        );

        submit = () => {
            if (unsubscribeMethods.HttpClient) {
                openNewTab(unsubscribeMethods.HttpClient);
            }
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
                <Row className="mt-4">
                    <Label className="cursor-default">
                        <span className="mr-2">{c('Info').t`Recipient: `}</span>
                    </Label>
                    <Field className="border bg-weak">
                        <div className="px-4 py-2 text-ellipsis" title={toEmails}>
                            {toEmails}
                        </div>
                    </Field>
                </Row>
                <Row>
                    <Label className="cursor-default">
                        <span className="mr-2">{c('Info').t`Subject: `}</span>
                    </Label>
                    <Field className="border bg-weak">
                        <div className="px-4 py-2 text-ellipsis" title={Subject}>
                            {Subject}
                        </div>
                    </Field>
                </Row>
                <Row>
                    <Label className="cursor-default">
                        <span className="mr-2">{c('Info').t`Body: `}</span>
                    </Label>
                    <Field className="border bg-weak">
                        <div className="px-4 py-2 text-ellipsis" title={Body}>
                            {Body}
                        </div>
                    </Field>
                </Row>
            </>
        );

        const inputMessage: PartialMessageState = {
            localID: generateUID('unsubscribe'),
            draftFlags: { autoSaveContacts: AUTO_SAVE_CONTACTS.DISABLED }, // Unsubscribe request should not save "to" address in contact list
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
    }

    const handleSubmit = async () => {
        unsubscribeModalProps.onClose();
        if (!hasSimpleLoginSender(message) && !hasProtonSender(message)) {
            setUnsubscribedModalOpen(true);
        }
        await submit();
        await api(markAsUnsubscribed([messageID]));
        await call();
        createNotification({ text: c('Success').t`Mail list unsubscribed` });
    };

    const handlePassAliasesModalOpen = () => {
        unsubscribedModalProps.onClose();
        setPassAliasesModalOpen(true);
    };

    /*
     * translator:
     * ${maskMyEmailButton} link to open the hide-my-email modal
     * Full sentence for reference: "Protect your email from being leaked to mailing lists or spammers with hide-my-email aliases."
     */
    const maskMyEmailButton = (
        <ButtonLike
            as="a"
            key="mask-my-email-button"
            className="ml-1"
            color="norm"
            shape="underline"
            onClick={handlePassAliasesModalOpen}
        >{c('Action').t`hide-my-email aliases`}</ButtonLike>
    );

    /*
     * translator:
     * ${maskMyEmailButton} link to open the hide-my-email modal
     * Full sentence for reference: "Protect your email from being leaked to mailing lists or spammers with hide-my-email."
     */
    const unsubscribeSLtext = c('Info')
        .jt`Protect your email from being leaked to mailing lists or spammers with ${maskMyEmailButton}.`;

    return (
        <div className="bg-norm rounded border pr-2 md:pr-1 pb-2 md:pb-1 pt-1 pl-2 mb-3 flex flex-nowrap flex-column md:flex-row">
            <div className="md:flex-1 flex flex-nowrap mb-2 md:mb-0">
                <Icon
                    name="envelope"
                    className="mt-0.5 md:mt-custom ml-0.5 shrink-0"
                    style={{ '--md-mt-custom': '0.375rem' }}
                />
                <span className="px-1 flex flex-1 items-center">{c('Status')
                    .t`This message is from a mailing list.`}</span>
            </div>
            <span className="shrink-0 items-start flex w-full md:w-auto pt-0.5">
                <Tooltip title={c('Info').t`This message is from a mailing list.`}>
                    <Button
                        onClick={() => setUnsubscribeModalOpen(true)}
                        size="small"
                        color="weak"
                        shape="outline"
                        fullWidth
                        className="rounded-sm"
                        data-testid="unsubscribe-banner"
                        disabled={loading || isUnsubscribed(message)}
                    >
                        {isUnsubscribed(message)
                            ? c('Status').t`Unsubscribed`
                            : loading
                              ? c('Action').t`Unsubscribing`
                              : c('Action').t`Unsubscribe`}
                    </Button>
                </Tooltip>
            </span>

            {renderUnsubscribeModal && (
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
            )}

            {renderUnsubscribedModal && (
                <Prompt
                    title={c('Title').t`Unsubscribe request sent`}
                    buttons={[<Button onClick={unsubscribedModalProps.onClose}>{c('Action').t`Close`}</Button>]}
                    {...unsubscribedModalProps}
                >
                    <span>{unsubscribeSLtext}</span>
                </Prompt>
            )}

            {renderPassAliasesModal && <ProtonPassAliasesModal {...passAliasesModalProps} />}
        </div>
    );
};

export default ExtraUnsubscribe;
