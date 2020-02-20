import React, { useState, ChangeEvent } from 'react';
import { FormModal, Label, Input, Alert, Row, Field, Radio, Href, PrimaryButton } from 'react-components';
import { c } from 'ttag';

enum LINK_TYPES {
    LINK = 'link',
    MAIL = 'mail',
    PHONE = 'phone'
}

const LABEL_DETAILS = {
    [LINK_TYPES.LINK]: c('Info').t`To what URL should this link go?`,
    [LINK_TYPES.MAIL]: c('Info').t`To what email address should this link?`,
    [LINK_TYPES.PHONE]: c('Info').t`To what phone number should this link?`
};

const PLACEHOLDERS = {
    [LINK_TYPES.LINK]: c('Placeholder').t`Add a web address`,
    [LINK_TYPES.MAIL]: c('Placeholder').t`Add an email address`,
    [LINK_TYPES.PHONE]: c('Placeholder').t`Add a phone address`
};

const getActualUrl = (url: string, type: LINK_TYPES) =>
    type === LINK_TYPES.LINK ? url : type === LINK_TYPES.MAIL ? `mailto:${url}` : `tel:${url}`;

interface Props {
    inputLabel: string;
    onSubmit: (url: string, label: string) => void;
    onClose?: () => void;
}

const EditorLinkModal = ({ inputLabel, onSubmit, onClose, ...rest }: Props) => {
    const [url, setUrl] = useState('');
    const [label, setLabel] = useState(inputLabel);
    const [type, setType] = useState(LINK_TYPES.LINK);

    const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
        if (url === label) {
            setLabel(event.target.value);
        }
    };

    const handleSubmit = () => {
        onSubmit(getActualUrl(url, type), label);
        onClose?.();
    };

    return (
        <FormModal
            title={c('Info').t`Insert link`}
            close={c('Action').t`Cancel`}
            submit={
                <PrimaryButton type="submit" disabled={!label || !url}>
                    {c('Action').t`Insert`}
                </PrimaryButton>
            }
            onSubmit={handleSubmit}
            onClose={onClose}
            {...rest}
        >
            <Alert>
                {c('Info')
                    .t`In the first box, put the link/email/phone number the text should go to. In the second box, put the text you want to appear.`}
            </Alert>
            <Row>
                <Label htmlFor="link-modal-url" className="flex flex-column">
                    <span>{c('Info').t`URL link`}</span>
                    <span>{LABEL_DETAILS[type]}</span>
                </Label>
                <Field>
                    <Input
                        id="link-modal-url"
                        value={url}
                        onChange={handleUrlChange}
                        placeholder={PLACEHOLDERS[type]}
                        required
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="link-modal-label" className="flex flex-column">
                    {c('Info').t`Text to display`}
                </Label>
                <Field>
                    <Input
                        id="link-modal-label"
                        value={label}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setLabel(event.target.value)}
                        placeholder={c('Placeholder').t`Link label`}
                        required
                    />
                </Field>
            </Row>
            {url && label && (
                <Row>
                    <span className="mr1">{c('Info').t`Test link:` + ' '}</span>
                    <Href url={getActualUrl(url, type)}>{label}</Href>
                </Row>
            )}
            <Row className="flex-justify-center mt2">
                <Radio
                    id="link-modal-type-link"
                    name="link-modal-type"
                    className="mr1"
                    checked={type === LINK_TYPES.LINK}
                    onChange={() => setType(LINK_TYPES.LINK)}
                >
                    {c('Info').t`Web address`}
                </Radio>
                <Radio
                    id="link-modal-type-mail"
                    name="link-modal-type"
                    className="mr1"
                    checked={type === LINK_TYPES.MAIL}
                    onChange={() => setType(LINK_TYPES.MAIL)}
                >
                    {c('Info').t`Email address`}
                </Radio>
                <Radio
                    id="link-modal-type-phone"
                    name="link-modal-type"
                    checked={type === LINK_TYPES.PHONE}
                    onChange={() => setType(LINK_TYPES.PHONE)}
                >
                    {c('Info').t`Phone address`}
                </Radio>
            </Row>
        </FormModal>
    );
};

export default EditorLinkModal;
