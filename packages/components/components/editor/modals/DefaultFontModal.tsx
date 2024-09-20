import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { updateFontFace, updateFontSize } from '@proton/shared/lib/api/mailSettings';

import FontFaceSelect from '../../../containers/layouts/FontFaceSelect';
import FontSizeSelect from '../../../containers/layouts/FontSizeSelect';
import { useApi, useEventManager, useMailSettings, useNotifications } from '../../../hooks';
import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE } from '../constants';
import { getFontFaceIdFromValue, getFontFaceValueFromId } from '../helpers/fontFace';

interface Props {
    onClose?: () => void;
    onChange?: (nextFontFace: string, nextFontSize: number) => void;
}

const DefaultFontModal = ({ onChange, onClose, ...rest }: Props) => {
    const api = useApi();
    const [settings] = useMailSettings();

    const [fontFace, setFontFace] = useState(getFontFaceValueFromId(settings?.FontFace) || DEFAULT_FONT_FACE);
    const [fontSize, setFontSize] = useState(settings?.FontSize || DEFAULT_FONT_SIZE);
    const [loading, setLoading] = useState(false);
    const { createNotification } = useNotifications();
    const { call } = useEventManager();

    const changedFontFace = fontFace !== settings?.FontFace;
    const changedFontSize = fontSize !== settings?.FontSize;
    const somethingChanged = changedFontFace || changedFontSize;

    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const onSubmit = async () => {
        setLoading(true);

        if (changedFontFace) {
            const fontFaceId = getFontFaceIdFromValue(fontFace);
            if (fontFaceId) {
                await api(updateFontFace(fontFaceId));
            }
        }

        if (changedFontSize) {
            await api(updateFontSize(fontSize));
        }

        if (somethingChanged) {
            await call();
            notifyPreferenceSaved();
        }

        onChange?.(fontFace, fontSize);

        setLoading(false);
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
                                id="fontFace"
                                fontFace={fontFace}
                                onChange={setFontFace}
                                loading={loading}
                            />
                        </div>
                        <div>
                            <FontSizeSelect
                                id="fontSize"
                                fontSize={fontSize}
                                onChange={setFontSize}
                                loading={loading}
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
