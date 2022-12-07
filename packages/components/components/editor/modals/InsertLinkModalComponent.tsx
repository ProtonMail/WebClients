import { ChangeEvent, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { LINK_TYPES } from '@proton/shared/lib/constants';
import { addLinkPrefix, linkToType } from '@proton/shared/lib/helpers/url';
import { MailSettings } from '@proton/shared/lib/interfaces';

import { useLinkHandler } from '../../../hooks/useLinkHandler';
import { PrimaryButton } from '../../button';
import Field from '../../container/Field';
import Row from '../../container/Row';
import { Form } from '../../form';
import Label from '../../label/Label';
import Href from '../../link/Href';
import { ModalStateProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../modalTwo';
import { Select } from '../../select';
import { InputTwo } from '../../v2';

export interface InsertLinkModalProps {
    selectionRangeFragment: DocumentFragment;
    cursorLinkElement: HTMLLinkElement | undefined;
    mailSettings?: MailSettings;
    onSubmit: (url: string, altAttribute: string | undefined, textToDisplay?: string) => void;
    modalStateProps: ModalStateProps;
}

const InsertLinkModalComponent = ({
    selectionRangeFragment,
    cursorLinkElement,
    onSubmit,
    mailSettings,
    modalStateProps,
}: InsertLinkModalProps) => {
    const modalContentRef = useRef<HTMLDivElement>(null);

    const { hasImageInSelection, hasOnlyImageInSelection, cursorLinkHrefAttr, cursorLinkTitleAttr } = useMemo(() => {
        const hasImageInSelection = selectionRangeFragment.querySelector('img') !== null;
        const hasOnlyImageInSelection = selectionRangeFragment.textContent === '' && hasImageInSelection;
        const cursorLinkHrefAttr = cursorLinkElement?.getAttribute('href') || undefined;
        const cursorLinkTitleAttr = cursorLinkElement?.getAttribute('title') || undefined;

        return { hasImageInSelection, hasOnlyImageInSelection, cursorLinkHrefAttr, cursorLinkTitleAttr };
    }, []);

    const [type, setType] = useState(linkToType(cursorLinkHrefAttr) || LINK_TYPES.WEB);
    const [url, setUrl] = useState(cursorLinkHrefAttr || '');
    const [label, setLabel] = useState<string>(
        selectionRangeFragment.textContent || cursorLinkElement?.textContent || cursorLinkTitleAttr || ''
    );
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

    const handleTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setType(event.target.value as LINK_TYPES);
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
                <ModalTwoHeader title={cursorLinkHrefAttr ? c('Info').t`Edit link` : c('Info').t`Insert link`} />
                <ModalTwoContent>
                    <div ref={modalContentRef}>
                        <div className="mb1">{c('Info')
                            .t`Please select the type of link you want to insert and fill in all the fields.`}</div>
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
                                    title={c('Info').t`Please fill out this field.`}
                                />
                            </Field>
                        </Row>
                        {(!hasImageInSelection || hasOnlyImageInSelection) && (
                            <Row>
                                <Label htmlFor="link-modal-label" className="flex flex-column">
                                    {hasOnlyImageInSelection
                                        ? c('Info').t`Image description`
                                        : c('Info').t`Text to display`}
                                </Label>
                                <Field>
                                    <InputTwo
                                        id="link-modal-label"
                                        value={label}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                            setLabel(event.target.value)
                                        }
                                        placeholder={c('Placeholder').t`Text`}
                                        required={!hasOnlyImageInSelection}
                                        title={c('Info').t`Please fill out this field.`}
                                    />
                                </Field>
                            </Row>
                        )}
                        {!hasImageInSelection && (
                            <Row>
                                <Label>{c('Info').t`Test link`}</Label>
                                <Field className="pt0-5 text-ellipsis">
                                    {url && label ? (
                                        <Href url={addLinkPrefix(url, type)} title={label}>
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
