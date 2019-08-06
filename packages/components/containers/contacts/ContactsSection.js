import React from 'react';
import { c } from 'ttag';
import { SubTitle, Row, Field, Label, AutoSaveContactsToggle, Info, useMailSettings } from 'react-components';

const ContactsSection = () => {
    const [{ AutoSaveContacts } = {}] = useMailSettings();
    return (
        <>
            <SubTitle>{c('Title').t`Contacts`}</SubTitle>
            <Row>
                <Label htmlFor="saveContactToggle">
                    <span className="mr0-5">{c('Label').t`Automatically save contacts`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/autosave-contact-list/" />
                </Label>
                <Field>
                    <AutoSaveContactsToggle autoSaveContacts={!!AutoSaveContacts} id="saveContactToggle" />
                </Field>
            </Row>
        </>
    );
};

export default ContactsSection;
