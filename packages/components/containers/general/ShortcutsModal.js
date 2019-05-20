import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { isMac } from 'proton-shared/lib/helpers/browser';
import { FormModal, Details, Summary, Legend } from 'react-components';

const ShortcutsModal = (props) => {
    const IS_MAC = isMac();
    return (
        <FormModal title={c('Title').t`Keyboard shortcuts`} close={c('Action').t`Close`} {...props}>
            <Details className="bordered-container mb1" open={true}>
                <Summary className="bold h3">{c('Title').t`General`}</Summary>
                <div className="flex-autogrid onmobile-flex-column">
                    <div className="flex-autogrid-item">
                        <Legend className="bold">{c('Title').t`Application`}</Legend>
                        <ul className="unstyled">
                            <li>
                                <kbd>?</kbd> Opens the <strong>help modal</strong>.
                            </li>
                            <li>
                                <kbd>/</kbd> Focus the <strong>search input</strong>.
                            </li>
                            <li>
                                <kbd>enter</kbd> Confirms <strong>the active modal</strong>.
                            </li>
                            <li>
                                <kbd>escape</kbd> Closes <strong>the active modal</strong>.
                            </li>
                            <li>
                                <kbd>shift</kbd> + <kbd>space</kbd> Opens <strong>the command palette</strong>.
                            </li>
                        </ul>
                    </div>
                    <div className="flex-autogrid-item">
                        <Legend className="bold">{c('Title').t`Composer`}</Legend>
                        <ul className="unstyled">
                            <li>
                                <kbd>c</kbd> Opens a new <strong>composer</strong>.
                            </li>
                            {IS_MAC ? (
                                <li>
                                    <kbd>command</kbd> + <kbd>enter</kbd> <strong>Sends</strong> the message.
                                </li>
                            ) : (
                                <li>
                                    <kbd>ctrl</kbd> + <kbd>enter</kbd> <strong>Sends</strong> the message.
                                </li>
                            )}
                            {IS_MAC ? (
                                <li>
                                    <kbd>command</kbd> + <kbd>s</kbd> <strong>Saves</strong> the message.
                                </li>
                            ) : (
                                <li>
                                    <kbd>ctrl</kbd> + <kbd>s</kbd> <strong>Saves</strong> the message.
                                </li>
                            )}
                            <li>
                                <kbd>escape</kbd> Closes the active <strong>composer</strong>.
                            </li>
                        </ul>
                    </div>
                </div>
            </Details>
            <Details className="bordered-container mb1">
                <Summary className="bold h3">{c('Title').t`Mail`}</Summary>
                <div className="flex-autogrid onmobile-flex-column">
                    <div className="flex-autogrid-item">
                        <Legend className="bold">{c('Title').t`Jumping`}</Legend>
                        <ul className="unstyled">
                            <li>
                                <kbd>g</kbd> then <kbd>i</kbd> Goes to <strong>inbox</strong>.
                            </li>
                            <li>
                                <kbd>g</kbd> then <kbd>d</kbd> Goes to <strong>drafts</strong>.
                            </li>
                            <li>
                                <kbd>g</kbd> then <kbd>s</kbd> Goes to <strong>sent</strong>.
                            </li>
                            <li>
                                <kbd>g</kbd> then <kbd>.</kbd> Goes to <strong>starred</strong>.
                            </li>
                            <li>
                                <kbd>g</kbd> then <kbd>a</kbd> Goes to <strong>archive</strong>.
                            </li>
                            <li>
                                <kbd>g</kbd> then <kbd>x</kbd> Goes to <strong>spam</strong>.
                            </li>
                            <li>
                                <kbd>g</kbd> then <kbd>t</kbd> Goes to <strong>trash</strong>.
                            </li>
                        </ul>
                    </div>
                    <div className="flex-autogrid-item">
                        <Legend className="bold">{c('Title').t`Navigation`}</Legend>
                        <ul className="unstyled">
                            <li>
                                <kbd>↑</kbd> Marks the <strong>previous</strong> message/conversation.
                            </li>
                            <li>
                                <kbd>↓</kbd> Marks the <strong>next</strong> message/conversation.
                            </li>
                            <li>
                                <kbd>←</kbd> Marks the last message.
                            </li>
                            <li>
                                <kbd>→</kbd> Unmarks the message.
                            </li>
                            <li>
                                <kbd>k</kbd> Displays the <strong>newer</strong> conversation.
                            </li>
                            <li>
                                <kbd>j</kbd> Displays the <strong>older</strong> conversation.
                            </li>
                            <li>
                                <kbd>enter</kbd> Opens the <strong>marked</strong> message/conversation.
                            </li>
                            <li>
                                <kbd>escape</kbd> Back to the list.
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="flex-autogrid onmobile-flex-column">
                    <div className="flex-autogrid-item">
                        <Legend className="bold">{c('Title').t`Threadlist`}</Legend>
                        <ul className="unstyled">
                            <li>
                                <kbd>*</kbd> then <kbd>a</kbd> <strong>Select all</strong> conversations.
                            </li>
                            <li>
                                <kbd>*</kbd> then <kbd>n</kbd> <strong>Unselect all</strong> conversations.
                            </li>
                            <li>
                                <kbd>x</kbd> Selects the message/conversation marked.
                            </li>
                            <li>
                                <kbd>r</kbd> Marks the message/conversation as <strong>read</strong>.
                            </li>
                            <li>
                                <kbd>u</kbd> Marks the message/conversation as <strong>unread</strong>.
                            </li>
                            <li>
                                <kbd>.</kbd> Marks or unmarks the message/conversation as <strong>starred</strong>.
                            </li>
                            <li>
                                <kbd>i</kbd> Moves the message/conversation to <strong>inbox</strong>.
                            </li>
                            <li>
                                <kbd>t</kbd> Moves the message/conversation to <strong>trash</strong>.
                            </li>
                            <li>
                                <kbd>a</kbd> Moves the message/conversation to <strong>archive</strong>.
                            </li>
                            <li>
                                <kbd>s</kbd> Moves the message/conversation to <strong>spam</strong>.
                            </li>
                        </ul>
                    </div>
                    <div className="flex-autogrid-item">
                        <Legend className="bold">{c('Title').t`Actions`}</Legend>
                        <ul className="unstyled">
                            <li>
                                <kbd>shift</kbd> + <kbd>r</kbd> Reply to a message/conversation.
                            </li>
                            <li>
                                <kbd>shift</kbd> + <kbd>a</kbd> Reply to all recipients for a message/conversation.
                            </li>
                            <li>
                                <kbd>shift</kbd> + <kbd>f</kbd> Forward a message/conversation.
                            </li>
                        </ul>
                    </div>
                </div>
            </Details>
            <Details className="bordered-container mb1">
                <Summary className="bold h3">{c('Title').t`Contacts`}</Summary>
                <div className="flex-autogrid onmobile-flex-column">
                    <div className="flex-autogrid-item">
                        <Legend className="bold">{c('Title').t`Contact list`}</Legend>
                        <ul className="unstyled">
                            <li>
                                <kbd>↑</kbd> + <kbd>↓</kbd> <strong>Moving</strong> between contacts.
                            </li>
                            <li>
                                <kbd>→</kbd> <strong>To enter</strong> contact details.
                            </li>
                            <li>
                                <kbd>t</kbd> <strong>To delete</strong> contact.
                            </li>
                        </ul>
                    </div>

                    <div className="flex-autogrid-item">
                        <Legend className="bold">{c('Title').t`Contact details`}</Legend>
                        <ul className="unstyled">
                            <li>
                                <kbd>←</kbd> <strong>Exits</strong> contact details.
                            </li>
                            <li>
                                <kbd>TAB</kbd> <strong>Navigates</strong> between fields.
                            </li>
                            <li>
                                <kbd>command</kbd> + <kbd>s</kbd> <strong>Saves</strong> the contact.
                            </li>
                        </ul>
                    </div>
                </div>
            </Details>
        </FormModal>
    );
};

ShortcutsModal.propTypes = {
    onClose: PropTypes.func
};

export default ShortcutsModal;
