import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Autocomplete from './Autocomplete';

const rawText = (item) => (_, node) => node.textContent === item;

describe('Autocomplete component', () => {
    it('should not render a list when input is less than minChars', () => {
        const enteredValue = 't';
        const list = ['test1', 'test2', 'test3'];
        const { queryByText, getByDisplayValue } = render(
            <Autocomplete minChars={2} list={list} inputValue={enteredValue} />
        );
        fireEvent.focus(getByDisplayValue(enteredValue));
        const listItems = list.map((item) => queryByText(rawText(item)));

        listItems.map((item) => expect(item).toBe(null));
    });

    it('should not render a list on input without focus', () => {
        const list = ['test1', 'test2', 'test3'];
        const { queryByText } = render(<Autocomplete minChars={1} list={list} inputValue="t" />);
        const listItems = list.map((item) => queryByText(rawText(item)));

        listItems.map((item) => expect(item).toBe(null));
    });

    it('should render a list of string values', () => {
        const enteredValue = 't';
        const list = ['test1', 'test2', 'test3'];
        const { getByText, getByDisplayValue } = render(
            <Autocomplete minChars={1} list={list} inputValue={enteredValue} />
        );
        fireEvent.focus(getByDisplayValue(enteredValue));
        const listItems = list.map((item) => getByText(rawText(item)));

        expect(listItems).toHaveLength(list.length);
    });

    it('should render a list of object values', () => {
        const enteredValue = 't';
        const list = [{ l: 'test1', v: 'T1' }, { l: 'test2', v: 'T2' }];
        const dataMapper = ({ l, v }) => ({ label: l, value: v });
        const { getByText, getByDisplayValue } = render(
            <Autocomplete minChars={1} list={list} inputValue={enteredValue} data={dataMapper} />
        );
        fireEvent.focus(getByDisplayValue(enteredValue));
        const listItems = list.map((item) => getByText(rawText(item.l)));

        expect(listItems).toHaveLength(list.length);
    });

    it('should call onSelect when item is selected from the list', () => {
        const onSubmitMock = jest.fn();
        const onSelectMock = jest.fn();
        const enteredValue = 't';
        const list = ['test1', 'test2', 'test3'];
        const { getByText, getByDisplayValue } = render(
            <Autocomplete
                minChars={1}
                list={list}
                inputValue={enteredValue}
                onSubmit={onSubmitMock}
                onSelect={onSelectMock}
            />
        );
        fireEvent.focus(getByDisplayValue(enteredValue));
        const listItem = getByText(rawText(list[1]));
        fireEvent.click(listItem);

        expect(onSelectMock).toHaveBeenCalledTimes(1);
        expect(onSubmitMock).toHaveBeenCalledTimes(0);
    });

    it('should call onSubmit when item custom item is added', async () => {
        const onSubmitMock = jest.fn();
        const onSelectMock = jest.fn();
        const list = ['test1', 'test2', 'test3'];
        const customItem = 'not-in-list';
        const { getByDisplayValue } = render(
            <Autocomplete
                minChars={1}
                list={list}
                inputValue={customItem}
                onSubmit={onSubmitMock}
                onSelect={onSelectMock}
            />
        );
        const inputEl = getByDisplayValue(customItem);
        fireEvent.blur(inputEl);

        expect(onSelectMock).toHaveBeenCalledTimes(0);
        expect(onSubmitMock).toHaveBeenCalledTimes(1);
    });

    it('should render children', () => {
        const children = <span className="test">test</span>;
        const { container } = render(<Autocomplete>{children}</Autocomplete>);
        expect(container.querySelector('.test')).toBeDefined();
    });
});
