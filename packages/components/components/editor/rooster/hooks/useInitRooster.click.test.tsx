import { useRef } from 'react';

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import type { IEditor } from 'roosterjs-editor-types';

import { ROOSTER_EDITOR_WRAPPER_ID } from '../../constants';
import type { EditorActions } from '../../interface';
import { initRoosterEditor } from '../helpers/initRoosterEditor';
import useInitRooster from './useInitRooster';

jest.mock('../helpers/initRoosterEditor', () => ({
    initRoosterEditor: jest.fn(),
}));

jest.mock('../../../../containers/themes/ThemeProvider', () => ({
    useTheme: () => ({ information: { style: '' } }),
}));

jest.mock('../../../../containers/themes/useSyncIframeStyles', () => ({
    __esModule: true,
    default: jest.fn(),
}));

type Props = Omit<Parameters<typeof useInitRooster>[0], 'iframeRef'>;

const TestEditor = (props: Props) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    useInitRooster({ ...props, iframeRef });
    return <iframe ref={iframeRef} title="Test editor" />;
};

const createProps = (): Props => ({
    onReady: jest.fn(),
    onFocus: jest.fn(),
    onEditorChange: jest.fn(),
    showModalLink: jest.fn(),
    onPasteFiles: jest.fn(),
    openEmojiPicker: jest.fn(),
});

const renderEditor = async (hasFocus: boolean) => {
    const editor = {
        dispose: jest.fn(),
        focus: jest.fn(),
        hasFocus: jest.fn(() => hasFocus),
    };
    const actions = {} as EditorActions;
    jest.mocked(initRoosterEditor).mockResolvedValueOnce({ editor: editor as unknown as IEditor, actions });

    const props = createProps();
    const view = render(<TestEditor {...props} />);

    await waitFor(() => expect(props.onReady).toHaveBeenCalledWith(actions));

    const iframe = view.getByTitle('Test editor') as HTMLIFrameElement;
    const wrapper = iframe.contentDocument?.getElementById(ROOSTER_EDITOR_WRAPPER_ID);
    expect(wrapper).not.toBeNull();

    return { editor, props, wrapper: wrapper as HTMLElement, ...view };
};

describe('useInitRooster wrapper click focus behavior', () => {
    beforeEach(() => {
        jest.mocked(initRoosterEditor).mockReset();
    });

    it('does not refocus an editor that already has focus', async () => {
        const { editor, props, wrapper } = await renderEditor(true);

        await act(async () => {
            fireEvent.click(wrapper);
        });

        expect(editor.focus).not.toHaveBeenCalled();
        expect(props.onFocus).toHaveBeenCalledTimes(1);
    });

    it('focuses an editor that does not have focus', async () => {
        const { editor, props, wrapper } = await renderEditor(false);

        await act(async () => {
            fireEvent.click(wrapper);
        });

        expect(editor.focus).toHaveBeenCalledTimes(1);
        expect(props.onFocus).toHaveBeenCalledTimes(1);
    });
});
