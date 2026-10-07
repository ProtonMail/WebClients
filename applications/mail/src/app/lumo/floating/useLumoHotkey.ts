import { useRef } from 'react';

import { useHotkeys } from '@proton/components/hooks/useHotkeys';
import { focusLumoPrompt } from '@proton/llm/lib/lumoAgent/ui/focusLumoPrompt';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { isBusy } from '@proton/shared/lib/shortcuts/helpers';

interface Props {
    isCurrentSurfaceOpen: boolean;
    openLumo: () => void;
}

export const useLumoHotkey = ({ isCurrentSurfaceOpen, openLumo }: Props) => {
    const [mailSettings] = useMailSettings();
    const documentRef = useRef(window.document);

    useHotkeys(documentRef, [
        [
            ['Shift', 'L'],
            (e) => {
                if (!mailSettings.Shortcuts || isBusy(e)) {
                    return;
                }
                e.preventDefault();
                if (!isCurrentSurfaceOpen) {
                    openLumo();
                    return;
                }
                focusLumoPrompt();
            },
        ],
    ]);
};
