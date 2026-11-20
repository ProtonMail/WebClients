import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import FontFaceSelect from '@proton/components/containers/layouts/FontFaceSelect';
import FontSizeSelect from '@proton/components/containers/layouts/FontSizeSelect';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import {
    DEFAULT_FONT_FACE,
    DEFAULT_FONT_SIZE,
    getFontFaceIdFromValue,
    getFontFaceValueFromId,
} from '@proton/shared/lib/mail/fontFace';

import { useComposerMessageHost } from '../../../host/composerMessageHost';

interface Props {
    mailSettings?: MailSettings;
    onClose?: () => void;
    onChange?: (nextFontFace: string, nextFontSize: number) => void;
}

const DefaultFontModal = ({ mailSettings, onChange, onClose, ...rest }: Props) => {
    const { useUpdateDefaultFont } = useComposerMessageHost();
    const updateDefaultFont = useUpdateDefaultFont();

    const [fontFace, setFontFace] = useState(getFontFaceValueFromId(mailSettings?.FontFace) || DEFAULT_FONT_FACE);
    const [fontSize, setFontSize] = useState(mailSettings?.FontSize || DEFAULT_FONT_SIZE);

    const changedFontFace = fontFace !== (getFontFaceValueFromId(mailSettings?.FontFace) || DEFAULT_FONT_FACE);
    const changedFontSize = fontSize !== (mailSettings?.FontSize || DEFAULT_FONT_SIZE);
    const somethingChanged = changedFontFace || changedFontSize;

    const onSubmit = () => {
        updateDefaultFont(
            {
                fontFaceId: changedFontFace ? getFontFaceIdFromValue(fontFace) : undefined,
                fontSize: changedFontSize ? fontSize : undefined,
            },
            () => onChange?.(fontFace, fontSize)
        );
        onClose?.();
    };

    return (
        <ModalTwo onSubmit={onSubmit} onClose={onClose} as={Form} size="small" {...rest}>
            <ModalTwoHeader title={c('Update font modal').t`Update default font and size`} />
            <ModalTwoContent>
                <div>
                    <div className="flex flex-row">
                        <div className="mr-4">
                            <FontFaceSelect
                                aria-label={c('Label').t`Font family`}
                                id="fontFace"
                                fontFace={fontFace}
                                onChange={setFontFace}
                            />
                        </div>
                        <div>
                            <FontSizeSelect
                                aria-label={c('Label').t`Font size`}
                                id="fontSize"
                                fontSize={fontSize}
                                onChange={setFontSize}
                            />
                        </div>
                    </div>

                    <p>
                        <span className="color-weak">{c('Update font modal')
                            .t`Your default font will look like following:`}</span>
                        <br />
                        <span className="mt-0" style={{ fontFamily: fontFace, fontSize: `${fontSize}px` }}>{c(
                            'Update font modal'
                        ).t`Today is a good day to write an email`}</span>
                    </p>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" disabled={!somethingChanged}>{c('Action').t`Update`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DefaultFontModal;
