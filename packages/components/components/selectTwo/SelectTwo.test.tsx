import React from 'react';
import { render, fireEvent, RenderResult, within } from '@testing-library/react';

import SelectTwo from './SelectTwo';
import { Option } from '../option';

function renderBasicSelect() {
    return render(
        <SelectTwo data-testid="dropdown-button">
            <Option title="one" value="one" />
            <Option title="two" value="two" />
            <Option title="three" value="three" />
        </SelectTwo>
    );
}

function renderSelectWithSelectedOption() {
    return render(
        <SelectTwo value="two" data-testid="dropdown-button">
            <Option title="one" value="one" />
            <Option title="two" value="two" />
            <Option title="three" value="three" />
        </SelectTwo>
    );
}

function getAnchor({ getByTestId }: RenderResult) {
    return getByTestId('dropdown-button');
}

function getList({ getByTestId }: RenderResult) {
    return getByTestId('select-list');
}

function openByClick(renderResult: RenderResult) {
    fireEvent.click(getAnchor(renderResult));
}

describe('SelectTwo component', () => {
    it('should open on click', () => {
        const output = renderBasicSelect();

        openByClick(output);

        expect(getList(output)).toBeInTheDocument();
    });

    it('should select a value on click', () => {
        const spy = jest.fn();

        const output = render(
            <SelectTwo onChange={spy} data-testid="dropdown-button">
                <Option title="one" value="one" />
                <Option title="two" value="two" />
            </SelectTwo>
        );

        openByClick(output);

        const { getByText } = output;

        fireEvent.click(getByText('one'));

        const [[{ value }]] = spy.mock.calls;

        expect(value).toBe('one');
    });

    it('should render a placeholer if no value is selected', () => {
        const { getByText } = render(
            <SelectTwo placeholder="Placeholder" data-testid="dropdown-button">
                <Option title="one" value="one" />
                <Option title="two" value="two" />
            </SelectTwo>
        );

        expect(getByText('Placeholder')).toBeTruthy();
    });

    it(`should open on " " (Space) keydown`, () => {
        const output = renderBasicSelect();

        fireEvent.keyDown(getAnchor(output), { key: ' ' });

        expect(getList(output)).toBeInTheDocument();
    });

    it('should focus the first element when opened and no option is selected', () => {
        const output = renderBasicSelect();

        openByClick(output);

        const { getByText } = output;

        expect(getByText('one')).toHaveFocus();
    });

    it('should focus the selected element when opened and an option is selected', () => {
        const output = renderSelectWithSelectedOption();

        openByClick(output);

        const { getByText } = within(getList(output));

        expect(getByText('two')).toHaveFocus();
    });

    /*
     * https://spectrum.chat/testing-library/general/ontransitionend~7b84288b-716e-42c3-853c-78295a92fd63
     */

    // it('should close on "Escape" keydown and give focus back to anchor', () => {
    //     const output = renderBasicSelect();

    //     openByClick(output);

    //     fireEvent.keyDown(getList(output), { key: 'Escape' });

    //     expect(getList(output)).not.toBeInTheDocument();
    //     expect(getAnchor(output)).toHaveFocus();
    // });

    it(`should focus the next option on "ArrowDown" keydown`, () => {
        const output = renderBasicSelect();

        openByClick(output);

        fireEvent.keyDown(getList(output), { key: 'ArrowDown' });

        const { getByText } = within(getList(output));

        expect(getByText('two')).toHaveFocus();
    });

    it(`should focus the previous option on "ArrowUp" keydown`, () => {
        const output = renderSelectWithSelectedOption();

        openByClick(output);

        fireEvent.keyDown(getList(output), { key: 'ArrowUp' });

        const { getByText } = within(getList(output));

        expect(getByText('one')).toHaveFocus();
    });

    /*
     * https://spectrum.chat/testing-library/general/ontransitionend~7b84288b-716e-42c3-853c-78295a92fd63
     */

    // it('should close the select and focus the anchor when pressing "Shift+Tab" given that the first element is selected', () => {
    //     const output = renderBasicSelect();

    //     openByClick(output);

    //     fireEvent.keyDown(getList(output), { key: 'Tab', shiftKey: true });

    //     expect(getList(output)).not.toBeInTheDocument();
    //     expect(getAnchor(output)).toHaveFocus();
    // });

    // it('should close the select and focus the anchor when pressing "Shift" given that the last element is selected', async () => {
    //     const output = renderBasicSelect();

    //     openByClick(output);

    //     fireEvent.keyDown(getList(output), { key: 'Tab' });
    //     fireEvent.keyDown(getList(output), { key: 'Tab' });
    //     fireEvent.keyDown(getList(output), { key: 'Tab' });

    //     expect(getList(output)).not.toBeInTheDocument();
    //     expect(getAnchor(output)).toHaveFocus();
    // });

    it('should focus the element most closely matching typed keyboard input', () => {
        const output = renderBasicSelect();

        openByClick(output);

        const list = getList(output);

        fireEvent.keyDown(list, { key: 't' });

        const { getByText } = within(list);

        expect(getByText('two')).toHaveFocus();
    });

    it('should clear the current typed input after a given amount of ms and match the new input after the delay', async () => {
        const output = render(
            <SelectTwo clearSearchAfter={800} data-testid="dropdown-button">
                <Option title="one" value="one" />
                <Option title="two" value="two" />
                <Option title="three" value="three" />
            </SelectTwo>
        );

        openByClick(output);

        const list = getList(output);

        fireEvent.keyDown(list, { key: 't' });

        const { getByText } = within(list);

        expect(getByText('two')).toHaveFocus();

        await new Promise((resolve) => setTimeout(resolve, 1000));

        fireEvent.keyDown(list, { key: 'o' });

        expect(getByText('one')).toHaveFocus();
    });

    it('continues the typed input from the last keystroke if the delay is small enough', () => {
        const output = renderBasicSelect();

        openByClick(output);

        const list = getList(output);

        fireEvent.keyDown(list, { key: 't' });

        const { getByText } = within(list);

        expect(getByText('two')).toHaveFocus();

        fireEvent.keyDown(list, { key: 'h' });

        expect(getByText('three')).toHaveFocus();
    });

    it('supports the search feature even with complex values given that "getSearchableValue" is supplied', () => {
        type V = { label: string; amount: number };

        const getSearchableValue = ({ label }: V) => label;

        const output = render(
            <SelectTwo getSearchableValue={getSearchableValue} data-testid="dropdown-button">
                <Option title="one" value={{ label: 'one' }} />
                <Option title="two" value={{ label: 'two' }} />
                <Option title="three" value={{ label: 'three' }} />
            </SelectTwo>
        );

        openByClick(output);

        const list = getList(output);

        fireEvent.keyDown(list, { key: 't' });
        fireEvent.keyDown(list, { key: 'w' });

        const { getByText } = output;

        expect(getByText('two')).toHaveFocus();
    });
});
