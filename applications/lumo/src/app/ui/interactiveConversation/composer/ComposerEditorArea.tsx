import { EditorContent } from '@tiptap/react';
import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import lumoStart from '@proton/styles/assets/img/illustrations/lumo-arrow.svg';
import lumoStop from '@proton/styles/assets/img/illustrations/lumo-stop.svg';

export interface ComposerEditorAreaProps {
    editor: any; // TipTap editor instance
    canShowSendButton: boolean;
    sendIsDisabled: boolean;
    isGenerating: boolean;
    isProcessingAttachment: boolean;
    onAbort?: () => void;
    onSubmit: () => void;
}

export const ComposerEditorArea = ({
    editor,
    canShowSendButton,
    sendIsDisabled,
    isGenerating,
    isProcessingAttachment,
    onAbort,
    onSubmit,
}: ComposerEditorAreaProps) => {
    return (
        <div
            className="lumo-input flex-grow w-full z-30 flex flex-row flex-nowrap items-center gap-3 p-2 pl-3 min-h-custom my-auto border border-weak bg-norm"
            style={{ '--min-h-custom': '3.5rem' /*56px*/ }}
        >
            {/* main text area where user types */}
            <EditorContent
                editor={editor}
                className="flex flex-row items-center w-full overflow-y-auto p-1 max-h-custom"
                style={{ '--max-h-custom': '13.125rem' /*210px*/ }}
            />

            {canShowSendButton && (
                <div className="flex flex-row self-end items-end gap-1 h-full shrink-0 composer-submit-button">
                    {/* send button (becomes abort button during generation) */}
                    <Tooltip
                        title={
                            isProcessingAttachment
                                ? c('collider_2025: Info').t`Please wait for files to finish processing`
                                : isGenerating
                                  ? c('collider_2025: Action').t`Stop generating`
                                  : c('collider_2025: Action').t`Send message`
                        }
                    >
                        <Button
                            icon
                            className="rounded-full p-0 ratio-square border-0 w-custom"
                            size="small"
                            style={{ inlineSize: '2.25rem' /* 36px */ }}
                            disabled={sendIsDisabled}
                            onClick={isGenerating ? onAbort : onSubmit}
                            color="norm"
                        >
                            <img
                                src={isGenerating ? lumoStop : lumoStart}
                                alt={
                                    isGenerating
                                        ? c('collider_2025: Action').t`Stop generating`
                                        : c('collider_2025: Action').t`Start generating`
                                }
                            />
                        </Button>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};
