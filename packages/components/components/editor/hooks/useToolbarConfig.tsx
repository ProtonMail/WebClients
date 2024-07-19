import { useCallback, useState } from 'react';

import useIsMounted from '@proton/hooks/useIsMounted';

import type { ToolbarConfig } from '../helpers/getToolbarConfig';
import { getToolbarConfig } from '../helpers/getToolbarConfig';
import type { EditorMetadata, SetEditorToolbarConfig } from '../interface';
import type { ModalDefaultFontProps, ModalImageProps, ModalLinkProps } from './interface';

interface Props {
    showModalLink: (options: ModalLinkProps) => void;
    showModalImage: (options: ModalImageProps) => void;
    showModalDefaultFont: (options: ModalDefaultFontProps) => void;
    onChangeMetadata: ((metadataChange: Partial<EditorMetadata>) => void) | undefined;
    onAddAttachments: ((files: File[]) => void) | undefined;
}

const useToolbarConfig = (props: Props): [ToolbarConfig | undefined, SetEditorToolbarConfig] => {
    const [toolbarConfig, setToolbarConfig] = useState<ToolbarConfig>();
    const isMounted = useIsMounted();

    const setConfigCallback = useCallback<SetEditorToolbarConfig>(
        (editorInstance) => {
            void getToolbarConfig(editorInstance, props).then((toolbarConfig) => {
                // Do not set state if component is unmounted
                if (!isMounted()) {
                    return;
                }
                setToolbarConfig(toolbarConfig);
            });
        },
        [props]
    );

    return [toolbarConfig, setConfigCallback];
};

export default useToolbarConfig;
