import type { Matcher, MatcherOptions } from '@testing-library/react';
import { fireEvent, render } from '@testing-library/react';

import { Input } from './Input';

type GetByTestIdType = (id: Matcher, options?: MatcherOptions | undefined) => HTMLElement;

const inputRootTestid = 'input-root';
const inputElementTestid = 'input-input-element';

describe('<Input />', () => {
    describe('uncontrolled', () => {
        it('sets input element value', () => {
            const { getByTestId } = render(<Input />);
            const input = getByTestId(inputElementTestid);

            fireEvent.input(input, { target: { value: 'a' } });

            expect(input).toHaveValue('a');
        });
    });

    describe('onValue', () => {
        it('calls onValue with value when input is fired', () => {
            const onValue = jest.fn();
            const { getByTestId } = render(<Input onValue={onValue} />);
            const input = getByTestId(inputElementTestid);

            fireEvent.input(input, { target: { value: 'a' } });

            expect(onValue).toHaveBeenCalledWith('a');
        });
    });

    describe('onChange', () => {
        it('calls onChange when input is fired', () => {
            const onChange = jest.fn();
            const { getByTestId } = render(<Input onChange={onChange} />);
            const input = getByTestId(inputElementTestid);

            fireEvent.input(input, { target: { value: 'a' } });

            expect(onChange.mock.lastCall[0].target.value).toEqual('a');
        });
    });

    describe('disableChange', () => {
        describe('true', () => {
            it('does not call onValue when input is fired', () => {
                const onValue = jest.fn();
                const { getByTestId } = render(<Input onValue={onValue} disableChange />);
                const input = getByTestId(inputElementTestid);

                fireEvent.input(input, { target: { value: 'a' } });

                expect(onValue).not.toHaveBeenCalled();
            });

            it('does not call onChange when input is fired', () => {
                const onChange = jest.fn();
                const { getByTestId } = render(<Input onChange={onChange} disableChange />);
                const input = getByTestId(inputElementTestid);

                fireEvent.input(input, { target: { value: 'a' } });

                expect(onChange).not.toHaveBeenCalled();
            });
        });

        describe('false', () => {
            it('calls onValue when input is fired', () => {
                const onValue = jest.fn();
                const { getByTestId } = render(<Input onValue={onValue} />);
                const input = getByTestId(inputElementTestid);

                fireEvent.input(input, { target: { value: 'a' } });

                expect(onValue).toHaveBeenCalled();
            });

            it('calls onChange when input is fired', () => {
                const onChange = jest.fn();
                const { getByTestId } = render(<Input onChange={onChange} />);
                const input = getByTestId(inputElementTestid);

                fireEvent.input(input, { target: { value: 'a' } });

                expect(onChange).toHaveBeenCalled();
            });
        });
    });

    describe('disabled', () => {
        it('does not add disabled class by default', () => {
            const { getByTestId } = render(<Input />);

            const inputRoot = getByTestId(inputRootTestid);

            expect(inputRoot).not.toHaveClass('disabled');
        });

        it('does not set disabled attribute by default', () => {
            const { getByTestId } = render(<Input />);
            const input = getByTestId(inputElementTestid);

            expect(input).not.toHaveAttribute('disabled');
        });

        describe('when false', () => {
            it('adds disabled class', () => {
                const { getByTestId } = render(<Input disabled={false} />);
                const inputRoot = getByTestId(inputRootTestid);

                expect(inputRoot).not.toHaveClass('disabled');
            });

            it('sets disabled attribute to true', () => {
                const { getByTestId } = render(<Input disabled={false} />);
                const input = getByTestId(inputElementTestid);

                expect(input).not.toHaveAttribute('disabled');
            });
        });

        describe('when true', () => {
            it('adds disabled class', () => {
                const { getByTestId } = render(<Input disabled />);
                const inputRoot = getByTestId(inputRootTestid);

                expect(inputRoot).toHaveClass('disabled');
            });

            it('sets disabled attribute to true', () => {
                const { getByTestId } = render(<Input disabled />);
                const input = getByTestId(inputElementTestid);

                expect(input).toHaveAttribute('disabled');
            });
        });
    });

    describe('error', () => {
        it('does not add error class by default', () => {
            const { getByTestId } = render(<Input />);

            const inputRoot = getByTestId(inputRootTestid);

            expect(inputRoot).not.toHaveClass('error');
        });

        it('does not set aria-invalid by default', () => {
            const { getByTestId } = render(<Input />);

            const inputElement = getByTestId(inputElementTestid);

            expect(inputElement).toHaveAttribute('aria-invalid', 'false');
        });

        describe('falsey', () => {
            const assertNoError = (getByTestId: GetByTestIdType) => {
                const inputRoot = getByTestId(inputRootTestid);
                const inputElement = getByTestId(inputElementTestid);

                expect(inputRoot).not.toHaveClass('error');
                expect(inputElement).toHaveAttribute('aria-invalid', 'false');
            };

            it('does not add error if error is false', () => {
                const { getByTestId } = render(<Input error={false} />);

                assertNoError(getByTestId);
            });

            it('does not add error if error is empty string', () => {
                const { getByTestId } = render(<Input error="" />);

                assertNoError(getByTestId);
            });
        });

        describe('truthy', () => {
            const assertError = (getByTestId: GetByTestIdType) => {
                const inputRoot = getByTestId(inputRootTestid);
                const inputElement = getByTestId(inputElementTestid);

                expect(inputRoot).toHaveClass('error');
                expect(inputElement).toHaveAttribute('aria-invalid', 'true');
            };

            it('does not add error if error is true', () => {
                const { getByTestId } = render(<Input error={true} />);

                assertError(getByTestId);
            });

            it('does not add error if error is non empty string', () => {
                const { getByTestId } = render(<Input error="hello" />);

                assertError(getByTestId);
            });

            it('does not add error if error is <></>', () => {
                const { getByTestId } = render(<Input error={<></>} />);

                assertError(getByTestId);
            });
        });
    });

    describe('unstyled', () => {
        it('does not add unstyled class by default', () => {
            const { getByTestId } = render(<Input />);

            const inputRoot = getByTestId(inputRootTestid);

            expect(inputRoot).not.toHaveClass('unstyled');
        });

        describe('when false', () => {
            it('does not add unstyled class', () => {
                const { getByTestId } = render(<Input unstyled={false} />);
                const inputRoot = getByTestId(inputRootTestid);

                expect(inputRoot).not.toHaveClass('unstyled');
            });
        });

        describe('when true', () => {
            it('adds unstyled class', () => {
                const { getByTestId } = render(<Input unstyled />);
                const inputRoot = getByTestId(inputRootTestid);

                expect(inputRoot).toHaveClass('unstyled');
            });
        });
    });
});
