import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { FeatureCode, useFeature, useTheme } from '@proton/components';
import { DARK_THEMES } from '@proton/shared/lib/themes/themes';
import { isPlainText } from '@proton/shared/lib/mail/messages';
import { applyDarkStyle } from '../../../logic/messages/read/messagesReadActions';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { canSupportDarkStyle } from '../../../helpers/message/messageContent';

const useMessageDarkStyles = (message: MessageState) => {
    const darkStylesFeature = useFeature(FeatureCode.DarkStylesInBody);
    const [theme] = useTheme();
    const dispatch = useDispatch();
    const isDarkTheme = DARK_THEMES.includes(theme);

    // canSupportDarkStyle is costly, so we only call it when needed
    const injectDarkStyle = useMemo(() => {
        return (
            darkStylesFeature.feature?.Value &&
            !message.messageDocument?.noDarkStyle &&
            isDarkTheme &&
            !isPlainText(message.data) &&
            canSupportDarkStyle(message)
        );
    }, [
        darkStylesFeature.feature?.Value,
        message.messageDocument?.noDarkStyle,
        isDarkTheme,
        message.data,
        message.messageDocument?.document,
    ]);

    useEffect(() => {
        if (injectDarkStyle) {
            dispatch(applyDarkStyle({ ID: message.localID, hasDarkStyle: true }));
        }
    }, [message.localID, injectDarkStyle]);

    if (darkStylesFeature.loading) {
        return isDarkTheme;
    }

    return injectDarkStyle;
};

export default useMessageDarkStyles;
