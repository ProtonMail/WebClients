import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useGetMailSettings, useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { CacheType } from '@proton/redux-utilities';
import { updateFontFace, updateFontSize } from '@proton/shared/lib/api/mailSettings';

import FontFaceSelect from '../../../containers/layouts/FontFaceSelect';
import FontSizeSelect from '../../../containers/layouts/FontSizeSelect';
import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE } from '../constants';
import { getFontFaceIdFromValue, getFontFaceValueFromId } from '../helpers/fontFace';

interface Props {
    onClose?: () => void;
    onChange?: (nextFontFace: string, nextFontSize: number) => void;
}

const DefaultFontModal = ({ onChange, onClose, ...rest }: Props) => {
    const api = useApi();
    const [mailSettings] = useMailSettings();
    const getMailSettings = useGetMailSettings();

    const [fontFace, setFontFace] = useState(getFontFaceValueFromId(mailSettings?.FontFace) || DEFAULT_FONT_FACE);
    const [fontSize, setFontSize] = useState(mailSettings?.FontSize || DEFAULT_FONT_SIZE);
    const [loading, setLoading] = useState(false);
    const { createNotification } = useNotifications();

    const changedFontFace = fontFace !== mailSettings?.FontFace;
    const changedFontSize = fontSize !== mailSettings?.FontSize;
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
            await getMailSettings({ cache: CacheType.None });
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
