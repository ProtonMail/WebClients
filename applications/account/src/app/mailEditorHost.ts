import type { EditorHost } from '@proton/mail-composer/components/editor/EditorHost';
import { useGetMailSettings, useMailSettings } from '@proton/mail/store/mailSettings/hooks';

export const mailEditorHost: EditorHost = { useMailSettings, useGetMailSettings };
