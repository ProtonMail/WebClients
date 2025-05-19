/* eslint-disable jsx-a11y/tabindex-no-positive */
import { fireEvent, render } from '@testing-library/react';

import ButtonLike from './ButtonLike';

const testid = 'button-like';

describe('<ButtonLike />', () => {
    it('renders with children', () => {
        const children = 'hello';
        const { container } = render(<ButtonLike>{children}</ButtonLike>);
        const rootElement = container.firstChild;

        expect(rootElement?.textContent).toBe(children);
    });

    it('adds button class by default', () => {
        const { container } = render(<ButtonLike />);
        const rootElement = container.firstChild;

        expect(rootElement).toHaveClass('button');
    });

    it('forwards className', () => {
        const className = 'should-be-forwarded';
        const { container } = render(<ButtonLike className={className} />);
        const rootElement = container.firstChild;

        expect(rootElement).toHaveClass(className);
    });

    it('allows clicking of button', () => {
        const mockOnClick = jest.fn();
        const { getByTestId } = render(<ButtonLike onClick={mockOnClick} data-testid={testid} />);
        const rootElement = getByTestId(testid);

        fireEvent.click(rootElement);

        expect(rootElement).not.toBeDisabled();
        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('allows setting of tabIndex', () => {
        const { container } = render(<ButtonLike tabIndex={0} />);
        const rootElement = container.firstChild;

        expect(rootElement).toHaveAttribute('tabIndex', '0');
    });

    it('sets aria-busy attribute to false by default', () => {
        const { container } = render(<ButtonLike />);
        const rootElement = container.firstChild;

        expect(rootElement).toHaveAttribute('aria-busy', 'false');
    });

    it('does not show loader component by default', () => {
        const { container } = render(<ButtonLike />);
        const loaderComponent = container.querySelector('.button-loader-container');

        expect(loaderComponent).toBeNull();
    });

    describe('as', () => {
        it('defaults to button element', () => {
            const { container } = render(<ButtonLike />);

            const button = container.querySelector('button');

            expect(button).toBeVisible();
        });

        it('allows setting of root element', () => {
            const { container } = render(<ButtonLike as="a" />);

            const button = container.querySelector('button');
            const a = container.querySelector('a');

            expect(button).toBeNull();
            expect(a).toBeVisible();
        });

        it(`adds 'inline-block text-center' classes if 'as' prop is not 'button'`, () => {
            const { container } = render(<ButtonLike as="a" />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveClass('inline-block');
            expect(rootElement).toHaveClass('text-center');
        });
    });

    describe('loading', () => {
        it('disables button', () => {
            const mockOnClick = jest.fn();
            const { getByTestId } = render(<ButtonLike loading onClick={mockOnClick} data-testid={testid} />);
            const rootElement = getByTestId(testid);

            fireEvent.click(rootElement);

            expect(rootElement).toBeDisabled();
            expect(mockOnClick).toHaveBeenCalledTimes(0);
        });

        it('adds aria-busy attribute when loading', () => {
            const { container } = render(<ButtonLike loading />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveAttribute('aria-busy', 'true');
        });

        it('sets tabIndex to -1', () => {
            const { container } = render(<ButtonLike loading tabIndex={0} />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveAttribute('tabIndex', '-1');
        });

        it('renders loader component', () => {
            const { container } = render(<ButtonLike loading />);
            const loaderComponent = container.querySelector('.button-loader-container');

            expect(loaderComponent).toBeVisible();
        });
    });

    describe('disabled', () => {
        it('sets tabIndex to -1', () => {
            const { container } = render(<ButtonLike disabled tabIndex={0} />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveAttribute('tabIndex', '-1');
        });

        it('disables button', () => {
            const mockOnClick = jest.fn();
            const { getByTestId } = render(<ButtonLike disabled onClick={mockOnClick} data-testid={testid} />);
            const rootElement = getByTestId(testid);

            fireEvent.click(rootElement);

            expect(rootElement).toBeDisabled();
            expect(mockOnClick).toHaveBeenCalledTimes(0);
        });
    });

    describe('shape', () => {
        it('defaults to outline if color is weak', () => {
            const { container } = render(<ButtonLike color="weak" />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveClass('button-outline-weak');
        });

        it('defaults to solid if color is not weak', () => {
            const { container } = render(<ButtonLike color="norm" />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveClass('button-solid-norm');
        });

        describe('solid', () => {
            it('uses button-solid-weak class', () => {
                const { container } = render(<ButtonLike shape="solid" />);
                const rootElement = container.firstChild;

                expect(rootElement).toHaveClass('button-solid-weak');
            });
        });

        describe('outline', () => {
            it('uses button-outline-weak class', () => {
                const { container } = render(<ButtonLike shape="outline" />);
                const rootElement = container.firstChild;

                expect(rootElement).toHaveClass('button-outline-weak');
            });
        });

        describe('ghost', () => {
            it('uses button-ghost-weak class', () => {
                const { container } = render(<ButtonLike shape="ghost" />);
                const rootElement = container.firstChild;

                expect(rootElement).toHaveClass('button-ghost-weak');
            });
        });

        describe('underline', () => {
            it('removes button class', () => {
                const { container } = render(<ButtonLike shape="underline" />);
                const rootElement = container.firstChild;

                expect(rootElement).not.toHaveClass('button');
            });

            it('adds button-underline class', () => {
                const { container } = render(<ButtonLike shape="underline" />);
                const rootElement = container.firstChild;

                expect(rootElement).toHaveClass('button-underline');
            });

            it('does not render as pill even if pill is true', () => {
                const { container } = render(<ButtonLike shape="underline" pill />);
                const rootElement = container.firstChild;

                expect(rootElement).not.toHaveClass('button-pill');
            });

            it('does not render as icon even if icon is true', () => {
                const { container } = render(<ButtonLike shape="underline" icon />);
                const rootElement = container.firstChild;

                expect(rootElement).not.toHaveClass('button-for-icon');
            });

            it('does not render full width even if fullWidth is true', () => {
                const { container } = render(<ButtonLike shape="underline" fullWidth />);
                const rootElement = container.firstChild;

                expect(rootElement).not.toHaveClass('w-full');
            });
        });
    });

    describe('color', () => {
        it('defaults to weak', () => {
            const { container } = render(<ButtonLike />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveClass('button-outline-weak');
        });

        describe('norm', () => {
            it('uses button-solid-norm class', () => {
                const { container } = render(<ButtonLike color="norm" />);
                const rootElement = container.firstChild;

                expect(rootElement).toHaveClass('button-solid-norm');
            });
        });

        describe('weak', () => {
            it('uses button-solid-weak class', () => {
                const { container } = render(<ButtonLike color="weak" />);
                const rootElement = container.firstChild;

                expect(rootElement).toHaveClass('button-outline-weak');
            });
        });
        describe('danger', () => {
            it('uses button-solid-danger class', () => {
                const { container } = render(<ButtonLike color="danger" />);
                const rootElement = container.firstChild;

                expect(rootElement).toHaveClass('button-solid-danger');
            });
        });
        describe('warning', () => {
            it('uses button-solid-warning class', () => {
                const { container } = render(<ButtonLike color="warning" />);
                const rootElement = container.firstChild;

                expect(rootElement).toHaveClass('button-solid-warning');
            });
        });
        describe('success', () => {
            it('uses button-solid-success class', () => {
                const { container } = render(<ButtonLike color="success" />);
                const rootElement = container.firstChild;

                expect(rootElement).toHaveClass('button-solid-success');
            });
        });
        describe('info', () => {
            it('uses button-solid-info class', () => {
                const { container } = render(<ButtonLike color="info" />);
                const rootElement = container.firstChild;

                expect(rootElement).toHaveClass('button-solid-info');
            });
        });
    });

    describe('size', () => {
        it('defaults to medium', () => {
            const { container } = render(<ButtonLike />);
            const rootElement = container.firstChild;

            /**
             * There is no button-medium class,
             * so we assert that the other size classes aren't included
             */
            expect(rootElement).not.toHaveClass('button-large');
            expect(rootElement).not.toHaveClass('button-small');
        });

        it('adds button-small class when size is small', () => {
            const { container } = render(<ButtonLike size="small" />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveClass('button-small');
        });

        it('adds button-large class when size is large', () => {
            const { container } = render(<ButtonLike size="large" />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveClass('button-large');
        });
    });

    describe('fullWidth', () => {
        it('adds w-full class if fullWidth is true', () => {
            const { container } = render(<ButtonLike fullWidth />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveClass('w-full');
        });

        it('does not add w-full class by default', () => {
            const { container } = render(<ButtonLike />);
            const rootElement = container.firstChild;

            expect(rootElement).not.toHaveClass('w-full');
        });
    });

    describe('pill', () => {
        it('adds button-pill class if pill is true', () => {
            const { container } = render(<ButtonLike pill />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveClass('button-pill');
        });

        it('does not add button-pill class by default', () => {
            const { container } = render(<ButtonLike />);
            const rootElement = container.firstChild;

            expect(rootElement).not.toHaveClass('button-pill');
        });
    });

    describe('icon', () => {
        it('adds button-for-icon class if icon is true', () => {
            const { container } = render(<ButtonLike icon />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveClass('button-for-icon');
        });

        it('does not add button-for-icon class by default', () => {
            const { container } = render(<ButtonLike />);
            const rootElement = container.firstChild;

            expect(rootElement).not.toHaveClass('button-for-icon');
        });
    });

    describe('group', () => {
        it('adds button-group-item class if group is true', () => {
            const { container } = render(<ButtonLike group />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveClass('button-group-item');
        });

        it('does not add button-group-item class by default', () => {
            const { container } = render(<ButtonLike />);
            const rootElement = container.firstChild;

            expect(rootElement).not.toHaveClass('button-group-item');
        });
    });

    describe('selected', () => {
        it('adds is-selected class if group and selected is true', () => {
            const { container } = render(<ButtonLike group selected />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveClass('is-selected');
        });

        it('does not add is-selected class if group is false and selected is true', () => {
            const { container } = render(<ButtonLike selected />);
            const rootElement = container.firstChild;

            expect(rootElement).not.toHaveClass('is-selected');
        });

        it('does not add is-selected by default', () => {
            const { container } = render(<ButtonLike />);
            const rootElement = container.firstChild;

            expect(rootElement).not.toHaveClass('is-selected');
        });
    });

    describe('roleProps', () => {
        it('adds no role by default', () => {
            const { container } = render(<ButtonLike />);
            const rootElement = container.firstChild;

            expect(rootElement).not.toHaveAttribute('role');
        });

        it('adds button role if onClick handler exists and no type is defined', () => {
            const { container } = render(<ButtonLike onClick={() => {}} type={undefined} />);
            const rootElement = container.firstChild;

            expect(rootElement).toHaveAttribute('role', 'button');
        });

        it('adds no role if type is defined', () => {
            const { container } = render(<ButtonLike type="button" />);
            const rootElement = container.firstChild;

            expect(rootElement).not.toHaveAttribute('role');
        });
    });
});
