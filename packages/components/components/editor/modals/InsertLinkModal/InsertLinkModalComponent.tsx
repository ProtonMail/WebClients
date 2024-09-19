import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, Href, Input } from '@proton/atoms';
import PrimaryButton from '@proton/components/components/button/PrimaryButton';
import Field from '@proton/components/components/container/Field';
import Row from '@proton/components/components/container/Row';
import Form from '@proton/components/components/form/Form';
import Option from '@proton/components/components/option/Option';
import { useMailSettings } from '@proton/components/hooks';
import { LINK_TYPES } from '@proton/shared/lib/constants';
import { addLinkPrefix, linkToType } from '@proton/shared/lib/helpers/url';

import { useLinkHandler } from '../../../../hooks/useLinkHandler';
import Label from '../../../label/Label';
import type { ModalStateProps } from '../../../modalTwo';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../modalTwo';
import { SelectTwo } from '../../../selectTwo';
import type { InsertLinkSelectionType } from './InsertLinkModal';

export interface InsertLinkModalProps {
    modalStateProps: ModalStateProps;
    onSubmit: (url: string, altAttribute: string | undefined, textToDisplay?: string) => void;
    selectionType: InsertLinkSelectionType;
    title: string;
    url?: string;
}

const InsertLinkModalComponent = ({
    modalStateProps,
    onSubmit,
    selectionType,
    title,
    url: initialUrl,
}: InsertLinkModalProps) => {
    const [mailSettings] = useMailSettings();
    const modalContentRef = useRef<HTMLDivElement>(null);

    const [type, setType] = useState(linkToType(initialUrl) || LINK_TYPES.WEB);
    const [url, setUrl] = useState(initialUrl || '');
    const [label, setLabel] = useState<string>(title);
    const hasImageInSelection = ['text-with-img', 'img'].includes(selectionType);

    // if image only url is required
    // if text label and url are required
    const canSubmit = hasImageInSelection ? !!url : !!(label && url);

    const { modal: linkModal } = useLinkHandler(modalContentRef, mailSettings);

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

    const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
        if (url === label && !hasImageInSelection) {
            setLabel(event.target.value);
        }
    };

    const handleSubmit = () => {
        onSubmit(addLinkPrefix(url, type), label, !hasImageInSelection ? label : undefined);
        modalStateProps.onClose();
    };

    return (
        <>
            <ModalTwo as={Form} onSubmit={handleSubmit} size="large" {...modalStateProps}>
                <ModalTwoHeader title={url ? c('Info').t`Edit link` : c('Info').t`Insert link`} />
                <ModalTwoContent>
                    <div ref={modalContentRef}>
                        <div className="mb-4">{c('Info')
                            .t`Please select the type of link you want to insert and fill in all the fields.`}</div>
                        <Row>
                            <Label htmlFor="link-modal-type" className="flex flex-column">
                                {c('Info').t`Link type`}
                            </Label>
                            <Field>
                                <SelectTwo
                                    id="link-modal-type"
                                    value={type}
                                    onChange={({ value }) => {
                                        setType(value);
                                    }}
                                >
                                    {typesOptions.map((option) => (
                                        <Option key={option.value} value={option.value} title={option.text} />
                                    ))}
                                </SelectTwo>
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
                                    title={c('Info').t`Please fill out this field.`}
                                />
                            </Field>
                        </Row>
                        {selectionType !== 'text-with-img' && (
                            <Row>
                                <Label htmlFor="link-modal-label" className="flex flex-column">
                                    {selectionType === 'img'
                                        ? c('Info').t`Image description`
                                        : c('Info').t`Text to display`}
                                </Label>
                                <Field>
                                    <Input
                                        id="link-modal-label"
                                        value={label}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                            setLabel(event.target.value)
                                        }
                                        placeholder={c('Placeholder').t`Text`}
                                        required={selectionType !== 'img'}
                                        title={c('Info').t`Please fill out this field.`}
                                    />
                                </Field>
                            </Row>
                        )}
                        {!hasImageInSelection && (
                            <Row>
                                <Label>{c('Info').t`Test link`}</Label>
                                <Field className="pt-2 text-ellipsis">
                                    {url && label ? (
                                        <Href href={addLinkPrefix(url, type)} title={label}>
                                            {label}
                                        </Href>
                                    ) : (
                                        <span className="placeholder">{c('Placeholder')
                                            .t`Please insert link first`}</span>
                                    )}
                                </Field>
                            </Row>
                        )}
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={modalStateProps.onClose} data-testid="insert-link:cancel">
                        {c('Action').t`Cancel`}
                    </Button>
                    <PrimaryButton type="submit" disabled={!canSubmit}>
                        {c('Action').t`Insert`}
                    </PrimaryButton>
                </ModalTwoFooter>
            </ModalTwo>
            {linkModal}
        </>
    );
};

export default InsertLinkModalComponent;
