import { useState, ChangeEvent, useRef } from 'react';
import { c } from 'ttag';
import { LINK_TYPES } from '@proton/shared/lib/constants';
import { linkToType, addLinkPrefix } from '@proton/shared/lib/helpers/url';
import { MailSettings } from '@proton/shared/lib/interfaces';
import FormModal from '../../modal/FormModal';
import { PrimaryButton } from '../../button';
import Alert from '../../alert/Alert';
import Row from '../../container/Row';
import Label from '../../label/Label';
import Field from '../../container/Field';
import Input from '../../input/Input';
import Href from '../../link/Href';
import { Select } from '../../select';
import { useLinkHandler } from '../../../hooks/useLinkHandler';

interface Props {
    linkLabel: string | undefined;
    linkUrl: string | undefined;
    onSubmit: (title: string, url: string) => void;
    onClose?: () => void;
    onMailTo?: (src: string) => void;
    mailSettings?: MailSettings;
}

const EditorLinkModal = ({
    linkLabel = '',
    linkUrl = '',
    onSubmit,
    onClose,
    onMailTo,
    mailSettings,
    ...rest
}: Props) => {
    const [url, setUrl] = useState(linkUrl);
    const [label, setLabel] = useState(linkLabel);
    const [type, setType] = useState(linkToType(linkUrl) || LINK_TYPES.WEB);
    const modalContentRef = useRef<HTMLDivElement>(null);

    useLinkHandler(modalContentRef, mailSettings, { onMailTo });

    const typesOptions = [
        { value: LINK_TYPES.WEB, text: c('Info').t`Web URL` },
        { value: LINK_TYPES.EMAIL, text: c('Info').t`Email address` },
        { value: LINK_TYPES.PHONE, text: c('Info').t`Phone number` },
    ];

    const i18n = {
        [LINK_TYPES.WEB]: {
            label: c('Info').t`URL link`,
            placeholder: c('Placeholder').t`Link`,
            'test-placeholder': c('Placeholder').t`Fill in the URL link and text to test your link`,
        },
        [LINK_TYPES.EMAIL]: {
            label: c('Info').t`Email address`,
            placeholder: c('Placeholder').t`Email address`,
            'test-placeholder': c('Placeholder').t`Fill in the email address and text to test your link`,
        },
        [LINK_TYPES.PHONE]: {
            label: c('Info').t`Phone number`,
            placeholder: c('Placeholder').t`Phone number`,
            'test-placeholder': c('Placeholder').t`Fill in the phone number and text to test your link`,
        },
    };

    const handleTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setType(event.target.value as LINK_TYPES);
    };

    const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
        if (url === label) {
            setLabel(event.target.value);
        }
    };

    const handleSubmit = () => {
        onSubmit(label, addLinkPrefix(url, type));
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
            innerRef={modalContentRef}
            {...rest}
        >
            <Alert className="mb1">{c('Info')
                .t`Please select the type of link you want to insert and fill in all the fields.`}</Alert>
            <Row>
                <Label htmlFor="link-modal-type" className="flex flex-column">
                    {c('Info').t`Link type`}
                </Label>
                <Field>
                    <Select
                        id="link-modal-type"
                        value={type}
                        onChange={handleTypeChange}
                        options={typesOptions}
                        required
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="link-modal-url" className="flex flex-column">
                    {i18n[type].label}
                </Label>
                <Field>
                    <Input
                        id="link-modal-url"
                        value={url}
                        onChange={handleUrlChange}
                        placeholder={i18n[type].placeholder}
                        required
                        autoFocus
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
                        placeholder={c('Placeholder').t`Text`}
                        required
                    />
                </Field>
            </Row>
            <Row>
                <Label>{c('Info').t`Test link`}</Label>
                <Field className="pt0-5 text-ellipsis">
                    {url && label ? (
                        <Href url={addLinkPrefix(url, type)} title={label}>
                            {label}
                        </Href>
                    ) : (
                        <span className="placeholder">{i18n[type]['test-placeholder']}</span>
                    )}
                </Field>
            </Row>
        </FormModal>
    );
};

export default EditorLinkModal;
