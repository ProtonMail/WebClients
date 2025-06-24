import { useMemo } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { Banner, Button, Href } from '@proton/atoms';
import {
    Field,
    Icon,
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Prompt,
    Row,
    useApi,
    useEventManager,
    useModalState,
    useNotifications,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import type {
    MessageStateWithData,
    MessageWithOptionalBody,
    PartialMessageState,
} from '@proton/mail/store/messages/messagesTypes';
import { markAsUnsubscribed, oneClickUnsubscribe } from '@proton/shared/lib/api/messages';
import { MIME_TYPES, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { AUTO_SAVE_CONTACTS } from '@proton/shared/lib/mail/mailSettings';
import { getOriginalTo, hasProtonSender, hasSimpleLoginSender, isUnsubscribed } from '@proton/shared/lib/mail/messages';
import generateUID from '@proton/utils/generateUID';
import isTruthy from '@proton/utils/isTruthy';

import { useOnCompose } from '../../../containers/ComposeProvider';
import { findSender } from '../../../helpers/message/messageRecipients';
import { useSendMessage } from '../../../hooks/composer/useSendMessage';
import { useSendVerifications } from '../../../hooks/composer/useSendVerifications';
import { useGetMessage } from '../../../hooks/message/useMessage';
import { useSaveDraft } from '../../../hooks/message/useSaveDraft';
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
    const toAddress = useMemo(() => getOriginalTo(message), [message]);
    const canonicalToAddress = useMemo(() => canonicalizeInternalEmail(toAddress), [toAddress]);
    const address = useMemo(
        () => addresses?.find(({ Email }) => canonicalizeInternalEmail(Email) === canonicalToAddress),
        [addresses, canonicalToAddress]
    );
    const [unsubscribeModalProps, setUnsubscribeModalOpen, renderUnsubscribeModal] = useModalState();
    const [unsubscribedModalProps, setUnsubscribedModalOpen, renderUnsubscribedModal] = useModalState();
    const [passAliasesModalProps, setPassAliasesModalOpen, renderPassAliasesModal] = useModalState();
    const unsubscribeMethods = message.UnsubscribeMethods || {};
    const hasUnsubscribeMethods = useMemo(() => !!Object.keys(unsubscribeMethods).length, [unsubscribeMethods]);
    const isSimpleLoginAlias = hasSimpleLoginSender(message);
    const descriptionText = useMemo(() => {
        if (isSimpleLoginAlias) {
            return c('Info').t`This message is from a ${PASS_APP_NAME} alias.`;
        }
        return c('Info').t`This message is from a mailing list.`;
    }, [isSimpleLoginAlias]);

    const actionText = useMemo(() => {
        if (isUnsubscribed(message)) {
            if (isSimpleLoginAlias) {
                return c('Status').t`Alias disabled`;
            }
            return c('Status').t`Unsubscribed`;
        }

        if (loading) {
            if (isSimpleLoginAlias) {
                return c('Action').t`Disabling alias`;
            }
            return c('Action').t`Unsubscribing`;
        }

        if (isSimpleLoginAlias) {
            return c('Action').t`Disable alias`;
        }

        return c('Action').t`Unsubscribe`;
    }, [loading, message]);

    if (!hasUnsubscribeMethods || !address) {
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

    const handlePassAliasesModalOpen = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        unsubscribedModalProps.onClose();
        setPassAliasesModalOpen(true);
    };

    const hideMyEmailAliasesLink = (
        <Href key="mask-my-email-button" color="norm" className="p-0" onClick={handlePassAliasesModalOpen}>{c('Action')
            .t`hide-my-email aliases`}</Href>
    );

    return (
        <Banner
            icon={<Icon name="envelope" />}
            variant="norm-outline"
            action={
                <Button
                    onClick={() => setUnsubscribeModalOpen(true)}
                    data-testid="unsubscribe-banner"
                    disabled={loading || isUnsubscribed(message)}
                >
                    {actionText}
                </Button>
            }
        >
            {descriptionText}

            {renderUnsubscribeModal && (
                <ModalTwo className="pm-modal--shorterLabels" {...unsubscribeModalProps}>
                    <ModalTwoHeader title={c('Title').t`Unsubscribe`} />
                    <ModalTwoContent>{modalContent}</ModalTwoContent>
                    <ModalTwoFooter>
                        <Button onClick={unsubscribeModalProps.onClose}>{c('Action').t`Cancel`}</Button>
                        <Button
                            color="norm"
                            onClick={() => withLoading(handleSubmit())}
                            data-testid="unsubscribe-banner:submit"
                        >{c('Action').t`Unsubscribe`}</Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}

            {renderUnsubscribedModal && (
                <Prompt
                    title={c('Title').t`Unsubscribe request sent`}
                    buttons={[
                        <Button onClick={unsubscribedModalProps.onClose} data-testid="unsubscribe-banner:close">{c(
                            'Action'
                        ).t`Got it`}</Button>,
                    ]}
                    {...unsubscribedModalProps}
                >
                    <p className="mb-2">{c('Info')
                        .jt`Protect your email from being leaked to mailing lists or spammers with ${hideMyEmailAliasesLink}.`}</p>
                </Prompt>
            )}

            {renderPassAliasesModal && <ProtonPassAliasesModal {...passAliasesModalProps} />}
        </Banner>
    );
};

export default ExtraUnsubscribe;
