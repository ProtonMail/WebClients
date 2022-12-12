import { fireEvent, render } from '@testing-library/react';

import { DEFAULT_FONT_FACE, FONT_FACES } from '../constants';
import { getFontFaceIdFromValue } from '../helpers/fontFace';
import ToolbarFontFaceDropdown from './ToolbarFontFaceDropdown';

describe('Toolbar font face dropdown', () => {
    it('Should display default font value when no values', () => {
        const { getByTestId } = render(
            <ToolbarFontFaceDropdown
                defaultValue={null}
                setValue={() => {}}
                onClickDefault={() => {}}
                showDefaultFontSelector
            />
        );

        const selectedValue = getByTestId('editor-toolbar:font-face:selected-value');
        const defaultFontFaceID = getFontFaceIdFromValue(DEFAULT_FONT_FACE);

        // To be "Arial"
        expect(selectedValue.innerHTML).toBe(defaultFontFaceID);
    });

    it('Should display fonts dropdown on click', () => {
        const { getByTestId } = render(
            <ToolbarFontFaceDropdown
                defaultValue={null}
                setValue={() => {}}
                onClickDefault={() => {}}
                showDefaultFontSelector
            />
        );

        const input = getByTestId('editor-toolbar:font-face:selected-value');
        fireEvent.click(input);

        Object.values(FONT_FACES).forEach(({ id }) => {
            expect(getByTestId(`editor-toolbar:font-face:dropdown-item:${id}`)).toBeInTheDocument();
        });
    });

    it('Should display "default font" button in dropdown', () => {
        const { getByTestId } = render(
            <ToolbarFontFaceDropdown
                defaultValue={null}
                setValue={() => {}}
                onClickDefault={() => {}}
                showDefaultFontSelector
            />
        );

        const input = getByTestId('editor-toolbar:font-face:selected-value');
        fireEvent.click(input);

        const defaultFontFaceID = getFontFaceIdFromValue(DEFAULT_FONT_FACE);
        expect(getByTestId(`editor-toolbar:font-face:dropdown-item:${defaultFontFaceID}`)).toBeInTheDocument();
        expect(getByTestId(`editor-toolbar:font-face:dropdown-item:${defaultFontFaceID}:default`)).toBeInTheDocument();
    });
});
