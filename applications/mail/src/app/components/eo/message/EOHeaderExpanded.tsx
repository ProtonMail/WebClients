import { classnames, Icon, InlineLinkButton, useToggle } from '@proton/components';
import * as React from 'react';
import { c } from 'ttag';

import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import { getRecipients } from '@proton/shared/lib/mail/messages';

import EOHeaderExpandedDetails from './EOHeaderExpandedDetails';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { Breakpoints } from '../../../models/utils';
import { recipientsToRecipientOrGroup } from '../../../helpers/addresses';
import RecipientItem from '../../message/recipients/RecipientItem';
import RecipientType from '../../message/recipients/RecipientType';
import ItemDate from '../../list/ItemDate';
import RecipientsDetails from '../../message/recipients/RecipientsDetails';
import RecipientSimple from '../../message/recipients/RecipientSimple';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import ExtraExpirationTime from '../../message/extras/ExtraExpirationTime';
import ExtraImagesLoader from '../../message/extras/ExtraImagesLoader';

interface Props {
    labelID: string;
    message: MessageState;
    messageLoaded: boolean;
    sourceMode: boolean;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
    onSourceMode: (sourceMode: boolean) => void;
    breakpoints: Breakpoints;
    parentMessageRef: React.RefObject<HTMLElement>;
}

const EOHeaderExpanded = ({
    labelID,
    message,
    messageLoaded,
    sourceMode,
    onLoadRemoteImages,
    onLoadEmbeddedImages,
    onSourceMode,
    breakpoints,
    parentMessageRef,
}: Props) => {
    const { state: showDetails, toggle: toggleDetails } = useToggle();

    const { isNarrow } = breakpoints;
    console.log(onSourceMode);
    const recipients = getRecipients(message.data);
    const recipientsOrGroup = recipientsToRecipientOrGroup(recipients);

    const from = (
        <RecipientItem recipientOrGroup={{ recipient: message.data?.Sender }} isLoading={!messageLoaded} isOutside />
    );

    const handleAttachmentIconClick = () => {
        scrollIntoView(parentMessageRef.current, { block: 'end' });
    };

    return (
        <div
            className={classnames([
                'message-header message-header-expanded is-outbound border-bottom',
                showDetails && 'message-header--showDetails',
                !messageLoaded && 'is-loading',
            ])}
            data-testid={`message-header-expanded:${message.data?.Subject}`}
        >
            <div className="flex flex-nowrap flex-align-items-center ml0-5 mr0-5 mb0-5">
                <span className="flex flex-item-fluid flex-nowrap mr0-5">
                    {showDetails ? (
                        <RecipientType
                            label={c('Label').t`From:`}
                            className={classnames([
                                'flex flex-align-items-start flex-nowrap',
                                !messageLoaded && 'flex-item-fluid',
                            ])}
                        >
                            {from}
                        </RecipientType>
                    ) : (
                        <div className={classnames(['flex flex-nowrap', !messageLoaded && 'flex-item-fluid'])}>
                            {from}
                        </div>
                    )}
                </span>
                <div
                    className={classnames([
                        'message-header-metas-container flex flex-align-items-center flex-item-noshrink',
                        isNarrow && 'flex-align-self-start',
                    ])}
                    data-testid="message:message-header-metas"
                >
                    {messageLoaded && !showDetails && !isNarrow && (
                        <ItemDate className="ml0-5" element={message.data} labelID={labelID} />
                    )}
                    {!messageLoaded && <span className="message-header-metas ml0-5 inline-flex" />}
                </div>
            </div>
            <div className="flex flex-nowrap flex-align-items-center m0-5 on-mobile-flex-wrap">
                <div className="flex-item-fluid flex flex-nowrap mr0-5 on-mobile-mr0 message-header-recipients">
                    {showDetails ? (
                        <RecipientsDetails message={message} isLoading={!messageLoaded} isOutside />
                    ) : (
                        <RecipientSimple recipientsOrGroup={recipientsOrGroup} isLoading={!messageLoaded} />
                    )}
                    <span
                        className={classnames([
                            'message-show-hide-link-container flex-item-noshrink',
                            showDetails ? 'mt0-25 on-mobile-mt0-5' : 'ml0-5',
                        ])}
                    >
                        {messageLoaded && (
                            <InlineLinkButton
                                onClick={toggleDetails}
                                className="message-show-hide-link"
                                disabled={!messageLoaded}
                                data-testid="message-show-details"
                            >
                                {showDetails
                                    ? c('Action').t`Hide details`
                                    : isNarrow
                                    ? c('Action').t`Details`
                                    : c('Action').t`Show details`}
                            </InlineLinkButton>
                        )}
                    </span>
                </div>
                {messageLoaded && !showDetails && !isNarrow && (
                    <>
                        <div className="flex-item-noshrink flex flex-align-items-center message-header-expanded-label-container">
                            <ItemAttachmentIcon
                                onClick={handleAttachmentIconClick}
                                element={message.data}
                                className="ml0-5"
                            />
                        </div>
                    </>
                )}
            </div>

            {!showDetails && isNarrow && (
                <div className="flex flex-justify-space-between flex-align-items-center border-top pt0-5 mb0-5">
                    {messageLoaded ? (
                        <>
                            <div className="flex flex-nowrap flex-align-items-center">
                                <Icon name="calendar-days" className="ml0-5 mr0-5" />
                                <ItemDate element={message.data} labelID={labelID} />
                            </div>
                            <div className="mlauto flex flex-nowrap flex-align-items-center">
                                <ItemAttachmentIcon
                                    onClick={handleAttachmentIconClick}
                                    element={message.data}
                                    className="ml0-5"
                                />
                            </div>
                        </>
                    ) : (
                        <span className="message-header-metas inline-flex" />
                    )}
                </div>
            )}

            {showDetails && (
                <EOHeaderExpandedDetails
                    message={message}
                    labelID={labelID}
                    onAttachmentIconClick={handleAttachmentIconClick}
                />
            )}

            <section className="message-header-extra border-top pt0-5 ">
                <div className="ml0-5 mr0-5 mb0-5">
                    {messageLoaded && <ExtraExpirationTime message={message} />}
                    {!sourceMode && (
                        <ExtraImagesLoader message={message} type="remote" onLoadImages={onLoadRemoteImages} />
                    )}
                    {!sourceMode && (
                        <ExtraImagesLoader message={message} type="embedded" onLoadImages={onLoadEmbeddedImages} />
                    )}
                </div>
            </section>
        </div>
    );
};

export default EOHeaderExpanded;
