import { useRef } from 'react';

import type {
    ModalDefaultFontProps,
    ModalImageProps,
    ModalLinkProps,
} from '@proton/components/components/editor/hooks/interface';
import useEditorModal from '@proton/components/components/editor/hooks/useEditorModal';
import useToolbarConfig from '@proton/components/components/editor/hooks/useToolbarConfig';
import type { EditorMetadata } from '@proton/components/components/editor/interface';

interface Props {
    onChangeMetadata?: (metadataChange: Partial<EditorMetadata>) => void;
    onAddAttachments?: (files: File[]) => void;
}

export const useToolbar = ({ onChangeMetadata, onAddAttachments }: Props) => {
    const modalLink = useEditorModal<ModalLinkProps>();
    const modalImage = useEditorModal<ModalImageProps>();
    const modalDefaultFont = useEditorModal<ModalDefaultFontProps>();
    const openEmojiPickerRef = useRef<() => void>(null);

    const [toolbarConfig, setToolbarConfig] = useToolbarConfig({
        showModalImage: modalImage.showCallback,
        showModalLink: modalLink.showCallback,
        showModalDefaultFont: modalDefaultFont.showCallback,
        onChangeMetadata,
        onAddAttachments,
    });

    return { openEmojiPickerRef, toolbarConfig, setToolbarConfig, modalLink, modalDefaultFont, modalImage };
};
