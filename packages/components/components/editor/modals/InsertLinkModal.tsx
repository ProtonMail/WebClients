import { useState, ChangeEvent, useRef } from 'react';
import { c } from 'ttag';
import { LINK_TYPES } from '@proton/shared/lib/constants';
import { linkToType, addLinkPrefix } from '@proton/shared/lib/helpers/url';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { PrimaryButton } from '../../button';
import Alert from '../../alert/Alert';
import Row from '../../container/Row';
import Label from '../../label/Label';
import Field from '../../container/Field';
import Href from '../../link/Href';
import { Button } from '../../button';
import { Select } from '../../select';
import { useLinkHandler } from '../../../hooks/useLinkHandler';
import { ModalTwoHeader, ModalTwo, ModalTwoContent, ModalTwoFooter } from '../../modalTwo';
import { Form } from '../../form';
import { InputTwo } from '../..';

interface Props {
    linkLabel?: string | undefined;
    linkUrl?: string | undefined;
    onSubmit?: (title: string, url: string) => void;
    onClose?: () => void;
    onMailTo?: (src: string) => void;
    mailSettings?: MailSettings;
}

const InsertLinkModal = ({
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

    const { modal: linkModal } = useLinkHandler(modalContentRef, mailSettings, { onMailTo });

    const typesOptions = [
        { value: LINK_TYPES.WEB, text: c('Info').t`Web URL` },
        { value: LINK_TYPES.EMAIL, text: c('Info').t`Email address` },
        { value: LINK_TYPES.PHONE, text: c('Info').t`Phone number` },
    ];

    const i18n = {
        [LINK_TYPES.WEB]: {
            label: c('Info').t`URL link`,
            placeholder: c('Placeholder').t`Link`,
        },
        [LINK_TYPES.EMAIL]: {
            label: c('Info').t`Email address`,
            placeholder: c('Placeholder').t`Email address`,
        },
        [LINK_TYPES.PHONE]: {
            label: c('Info').t`Phone number`,
            placeholder: c('Placeholder').t`Phone number`,
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
        onSubmit?.(label, addLinkPrefix(url, type));
        onClose?.();
    };

    return (
        <>
            <ModalTwo as={Form} onSubmit={handleSubmit} onClose={onClose} size="large" {...rest}>
                <ModalTwoHeader title={c('Info').t`Insert link`} />
                <ModalTwoContent>
                    <div ref={modalContentRef}>
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
                                <InputTwo
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
                                <InputTwo
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
                                    <span className="placeholder">{c('Placeholder').t`Please insert link first`}</span>
                                )}
                            </Field>
                        </Row>
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                    <PrimaryButton type="submit" disabled={!label || !url}>
                        {c('Action').t`Insert`}
                    </PrimaryButton>
                </ModalTwoFooter>
            </ModalTwo>
            {linkModal}
        </>
    );
};

export default InsertLinkModal;
