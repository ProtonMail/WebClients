import React, { useState } from 'react';
import { c } from 'ttag';
import { updateFontFace, updateFontSize } from '@proton/shared/lib/api/mailSettings';

import { Button, ModalTwo, ModalTwoContent, ModalTwoHeader, ModalTwoFooter, Form } from '../../../components';
import { useMailSettings, useNotifications, useApi, useEventManager } from '../../../hooks';
import FontSizeSelect from '../../../containers/layouts/FontSizeSelect';
import FontFaceSelect from '../../../containers/layouts/FontFaceSelect';
import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE } from '../constants';

interface Props {
    onClose?: () => void;
    onChange?: (nextFontFace: string, nextFontSize: number) => void;
}

const DefaultFontModal = ({ onChange, onClose, ...rest }: Props) => {
    const api = useApi();
    const [settings] = useMailSettings();
    const [fontFace, setFontFace] = useState(settings?.FontFace || DEFAULT_FONT_FACE);
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
            await api(updateFontFace(fontFace));
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
                        <div className="mr1">
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
                        <span className="mt0" style={{ fontFamily: fontFace, fontSize: `${fontSize}px` }}>{c(
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
