import { StrictMode, useRef } from 'react';

import { act, render } from '@testing-library/react';
import type { IEditor } from 'roosterjs-editor-types';

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
type Initialization = Awaited<ReturnType<typeof initRoosterEditor>>;

const TestEditor = (props: Props) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    useInitRooster({ ...props, iframeRef });
    return <iframe ref={iframeRef} title="Test editor" />;
};

const createInitialization = () => {
    const editor = { dispose: jest.fn(), focus: jest.fn() };
    const actions = {} as EditorActions;
    let resolve!: (result: Initialization) => void;
    const promise = new Promise<Initialization>((resolvePromise) => {
        resolve = resolvePromise;
    });

    return {
        editor,
        actions,
        promise,
        resolve: () => resolve({ editor: editor as unknown as IEditor, actions }),
    };
};

const createProps = (): Props => ({
    onReady: jest.fn(),
    onEditorChange: jest.fn(),
    showModalLink: jest.fn(),
    onPasteFiles: jest.fn(),
    openEmojiPicker: jest.fn(),
});

describe('useInitRooster', () => {
    beforeEach(() => {
        jest.mocked(initRoosterEditor).mockReset();
    });

    it('disposes an editor that finishes initializing after unmount without calling onReady', async () => {
        const initialization = createInitialization();
        jest.mocked(initRoosterEditor).mockReturnValueOnce(initialization.promise);
        const props = createProps();
        const { unmount } = render(<TestEditor {...props} />);

        expect(initRoosterEditor).toHaveBeenCalledTimes(1);
        unmount();
        expect(initialization.editor.dispose).not.toHaveBeenCalled();

        await act(async () => {
            initialization.resolve();
            await initialization.promise;
        });

        expect(initialization.editor.dispose).toHaveBeenCalledTimes(1);
        expect(props.onReady).not.toHaveBeenCalled();
    });

    it('calls onReady while mounted and disposes the editor on unmount', async () => {
        const initialization = createInitialization();
        jest.mocked(initRoosterEditor).mockReturnValueOnce(initialization.promise);
        const props = createProps();
        const { unmount } = render(<TestEditor {...props} />);

        await act(async () => {
            initialization.resolve();
            await initialization.promise;
        });

        expect(props.onReady).toHaveBeenCalledTimes(1);
        expect(props.onReady).toHaveBeenCalledWith(initialization.actions);
        expect(initialization.editor.dispose).not.toHaveBeenCalled();

        unmount();

        expect(initialization.editor.dispose).toHaveBeenCalledTimes(1);
    });

    it('disposes the editor if onReady synchronously unmounts the component', async () => {
        const initialization = createInitialization();
        jest.mocked(initRoosterEditor).mockReturnValueOnce(initialization.promise);
        let unmount!: () => void;
        const props = createProps();
        props.onReady = jest.fn(() => unmount());
        ({ unmount } = render(<TestEditor {...props} />));

        await act(async () => {
            initialization.resolve();
            await initialization.promise;
        });

        expect(props.onReady).toHaveBeenCalledTimes(1);
        expect(initialization.editor.dispose).toHaveBeenCalledTimes(1);
    });

    it('ignores a stale StrictMode initialization and only readies the current editor', async () => {
        const staleInitialization = createInitialization();
        const currentInitialization = createInitialization();
        jest.mocked(initRoosterEditor)
            .mockReturnValueOnce(staleInitialization.promise)
            .mockReturnValueOnce(currentInitialization.promise);
        const props = createProps();
        const { unmount } = render(
            <StrictMode>
                <TestEditor {...props} />
            </StrictMode>
        );

        expect(initRoosterEditor).toHaveBeenCalledTimes(2);

        await act(async () => {
            staleInitialization.resolve();
            await staleInitialization.promise;
        });

        expect(staleInitialization.editor.dispose).toHaveBeenCalledTimes(1);
        expect(props.onReady).not.toHaveBeenCalled();

        await act(async () => {
            currentInitialization.resolve();
            await currentInitialization.promise;
        });

        expect(props.onReady).toHaveBeenCalledTimes(1);
        expect(props.onReady).toHaveBeenCalledWith(currentInitialization.actions);
        expect(currentInitialization.editor.dispose).not.toHaveBeenCalled();

        unmount();

        expect(currentInitialization.editor.dispose).toHaveBeenCalledTimes(1);
    });
});
