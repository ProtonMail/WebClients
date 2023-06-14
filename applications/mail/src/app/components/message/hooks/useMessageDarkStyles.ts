import { RefObject, useEffect, useMemo } from 'react';

import { FeatureCode, useFeature, useTheme } from '@proton/components';
import { isNewsLetter, isPlainText } from '@proton/shared/lib/mail/messages';

import { canSupportDarkStyle } from '../../../helpers/message/messageContent';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { applyDarkStyle } from '../../../logic/messages/read/messagesReadActions';
import { useAppDispatch } from '../../../logic/store';

const useMessageDarkStyles = (
    message: MessageState,
    isIframeContentSet: boolean,
    iframeRef: RefObject<HTMLIFrameElement>
) => {
    const darkStylesFeature = useFeature(FeatureCode.DarkStylesInBody);
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const needCompute =
        darkStylesFeature.feature?.Value &&
        !message.messageDocument?.noDarkStyle &&
        theme.information.dark &&
        !isPlainText(message.data) &&
        !isNewsLetter(message.data);

    // canSupportDarkStyle is costly, so we only call it when needed
    const { support, loading } = useMemo(() => {
        if (!needCompute) {
            return { support: false, loading: false };
        }
        if (!isIframeContentSet) {
            return { support: true, loading: true };
        }
        return { support: canSupportDarkStyle(iframeRef.current), loading: false };
    }, [message.localID, needCompute, isIframeContentSet]);

    useEffect(() => {
        if (!loading && support) {
            dispatch(applyDarkStyle({ ID: message.localID, hasDarkStyle: true }));
        }
    }, [message.localID, support, loading]);

    if (darkStylesFeature.loading) {
        return { support: false, loading: true };
    }

    return { support, loading };
};

export default useMessageDarkStyles;
