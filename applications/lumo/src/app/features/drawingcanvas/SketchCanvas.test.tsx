import { fireEvent, render, screen } from '@testing-library/react';

import { injectNativeImageGenerationHelper } from '../../remote/nativeComposerBridgeHelpers';
import { SketchCanvas } from './SketchCanvas';

vi.mock('../../remote/nativeComposerBridgeHelpers');
vi.mock('../../components/Composer/hooks/useNativeComposerVisibilityApi', () => ({
    useNativeComposerVisibilityApi: () => ({}),
}));
vi.mock('./Canvas', () => ({ Canvas: () => <canvas /> }));

describe('SketchCanvas export', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,c2tldGNo');
    });

    it('attaches a sketch without replacing the native draft when no description was entered', () => {
        const onExport = vi.fn();
        render(<SketchCanvas onExport={onExport} onClose={() => {}} />);

        fireEvent.click(screen.getByRole('button', { name: 'Done' }));

        expect(onExport).toHaveBeenCalledWith('data:image/png;base64,c2tldGNo', 'blank', '');
        expect(injectNativeImageGenerationHelper).not.toHaveBeenCalled();
    });

    it('prefills an intentional description when exporting an edited image', () => {
        const onExport = vi.fn();
        render(<SketchCanvas mode="overlay" onExport={onExport} onClose={() => {}} />);

        fireEvent.change(screen.getByRole('textbox', { name: 'Describe what to change' }), {
            target: { value: '  Make the line blue  ' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Done' }));

        expect(injectNativeImageGenerationHelper).toHaveBeenCalledWith('Make the line blue');
        expect(onExport).toHaveBeenCalledWith('data:image/png;base64,c2tldGNo', 'overlay', 'Make the line blue');
    });
});
