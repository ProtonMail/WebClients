import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Icon, SimpleDropdown, PrimaryButton, Label, Select, useLabels } from 'react-components';
import { MAILBOX_LABEL_IDS, LABEL_EXCLUSIVE } from 'proton-shared/lib/constants';
import { c } from 'ttag';

const ALL = 'all';
const { INBOX, TRASH, SPAM, ARCHIVE } = MAILBOX_LABEL_IDS;

const AdvancedSearchDropdown = ({ location, history }) => {
    const formRef = useRef();
    const [model, updateModel] = useState({});
    const [labels = []] = useLabels();
    const locationOptions = [
        { value: ALL, text: c('Option').t`All` },
        { value: INBOX, text: c('Mailbox').t`Inbox` },
        { value: ARCHIVE, text: c('Mailbox').t`Archive` },
        { value: SPAM, text: c('Mailbox').t`Spam` },
        { value: TRASH, text: c('Mailbox').t`Trash` }
    ]
        .concat(
            labels
                .filter(({ Exclusive }) => Exclusive === LABEL_EXCLUSIVE.FOLDER)
                .map(({ ID: value, Name: text }) => ({ value, text }))
        )
        .concat(
            labels
                .filter(({ Exclusive }) => Exclusive === LABEL_EXCLUSIVE.LABEL)
                .map(({ ID: value, Name: text }) => ({ value, text }))
        );
    const handleSubmit = () => {
        const state = {}; // TODO
        history.push({ ...location }, state);
        formRef.current.reset();
    };
    return (
        <SimpleDropdown
            originalPlacement="bottom-right"
            hasCaret={false}
            content={<Icon name="caret" className="fill-white searchbox-advanced-search-icon" />}
            className="searchbox-advanced-search-button"
        >
            <form ref={formRef} name="advanced-search" className="p1" onSubmit={handleSubmit}>
                <div className="mb1">
                    <Label htmlFor="location">{c('Label').t`Location`}</Label>
                    <Select
                        id="location"
                        options={locationOptions}
                        onChange={({ target }) => updateModel({ ...model, location: target.value })}
                    />
                </div>
                <div className="mb1 flex flex-nowrap">
                    <div className="mr1">
                        <Label>{c('Label').t`Sender`}</Label>
                    </div>
                    <div>
                        <Label>{c('Label').t`Recipient`}</Label>
                    </div>
                </div>
                <div className="mb1 flex flex-nowrap">
                    <div className="mr1">
                        <Label>{c('Label').t`Start date`}</Label>
                    </div>
                    <div>
                        <Label>{c('Label').t`End date`}</Label>
                    </div>
                </div>
                <div className="mb1 flex flex-nowrap">
                    <div className="mr1">
                        <Label>{c('Label').t`Address`}</Label>
                    </div>
                    <div>
                        <Label>{c('Label').t`Attachments`}</Label>
                    </div>
                </div>
                <div>
                    <PrimaryButton className="w100" type="submit">{c('Action').t`Search`}</PrimaryButton>
                </div>
            </form>
        </SimpleDropdown>
    );
};

AdvancedSearchDropdown.propTypes = {
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

export default AdvancedSearchDropdown;
