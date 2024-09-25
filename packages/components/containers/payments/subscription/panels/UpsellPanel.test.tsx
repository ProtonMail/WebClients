import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { omit } from '@proton/shared/lib/helpers/object';
import { mockDefaultBreakpoints } from '@proton/testing/lib/mockUseActiveBreakpoint';

import type { UpsellPanelProps } from './UpsellPanel';
import UpsellPanel from './UpsellPanel';

jest.mock('@proton/components/hooks/useActiveBreakpoint');
const mockUseActiveBreakpoint = useActiveBreakpoint as jest.MockedFn<typeof useActiveBreakpoint>;

describe('UpsellBox', () => {
    beforeEach(() => {
        mockUseActiveBreakpoint.mockReturnValue(mockDefaultBreakpoints);
    });

    const handleUpgrade = jest.fn();
    const upsellBoxBaseProps: UpsellPanelProps = {
        title: 'Upgrade to Plus',
        features: [
            {
                icon: 'storage',
                text: `10GB total storage`,
            },
            {
                icon: 'envelope',
                text: `10 email addresses/aliases`,
            },
            {
                icon: 'tag',
                text: `Unlimited folders, labels, and filters`,
            },
        ],
        ctas: [
            {
                label: 'From 3.99€',
                action: handleUpgrade,
                shape: 'outline',
            },
        ],
    };

    it('should correctly render a basic upsell box', () => {
        const { container } = render(
            <UpsellPanel {...upsellBoxBaseProps}>Upgrade to Plus pack to access to more services</UpsellPanel>
        );
        // should have basic style
        expect(container.firstChild).toHaveClass('border-strong');

        // should not have `recommended` label
        const recommendedLabel = screen.queryByText('Recommended');
        expect(recommendedLabel).toBeNull();

        // header
        expect(screen.getByText('Upgrade to Plus'));
        expect(screen.getByText('Upgrade to Plus pack to access to more services'));

        // features
        expect(screen.getByText('10GB total storage'));
        expect(screen.getByText('10 email addresses/aliases'));
        expect(screen.getByText('Unlimited folders, labels, and filters'));

        // actions
        const button = screen.getByText('From 3.99€');
        expect(button).toHaveClass('button-outline-weak');
    });

    it('should correctly handle upsell click action', async () => {
        render(<UpsellPanel {...upsellBoxBaseProps} />);

        const button = screen.getByText('From 3.99€');
        fireEvent.click(button);
        await waitFor(() => expect(handleUpgrade).toHaveBeenCalledTimes(1));
    });

    describe('isRecommended is true', () => {
        it('should render with primary border', () => {
            const { container } = render(<UpsellPanel {...upsellBoxBaseProps} isRecommended />);

            // should have basic style
            expect(container.firstChild).toHaveClass('border-primary');
            expect(container.firstChild).toHaveClass('border-recommended');

            // should have label rendered
            expect(screen.getByText('Recommended'));
        });

        describe('when action button is outline', () => {
            it('should render with primary border and buttons', () => {
                render(
                    <UpsellPanel
                        {...omit(upsellBoxBaseProps, ['ctas'])}
                        ctas={[
                            {
                                label: 'From 3.99€',
                                action: handleUpgrade,
                                shape: 'outline',
                            },
                        ]}
                        isRecommended
                    />
                );

                // actions
                const button = screen.getByText('From 3.99€');
                expect(button).toHaveClass('button-solid-norm');
            });
        });

        describe('when action button is other than outline/solid', () => {
            it('should not change color and shape of the button', () => {
                render(
                    <UpsellPanel
                        {...omit(upsellBoxBaseProps, ['ctas'])}
                        ctas={[
                            {
                                label: 'From 3.99€',
                                action: handleUpgrade,
                                shape: 'ghost',
                                color: 'norm',
                            },
                        ]}
                        isRecommended
                    />
                );

                // actions
                const button = screen.getByText('From 3.99€');
                expect(button).toHaveClass('button-ghost-norm');
            });
        });
    });

    describe('when one item as a tooltip', () => {
        it('should render a tooltip in the DOM', () => {
            render(
                <UpsellPanel
                    {...omit(upsellBoxBaseProps, ['features'])}
                    features={[
                        {
                            icon: 'envelope',
                            text: `10 email addresses/aliases`,
                            tooltip: 'You can use those aliases on different website to protect your main email',
                        },
                    ]}
                />
            );

            expect(screen.getByText('10 email addresses/aliases'));
            expect(
                screen.getByText('More info: You can use those aliases on different website to protect your main email')
            );
        });
    });

    describe('when a children is provided', () => {
        it('should render the children', () => {
            render(
                <UpsellPanel {...upsellBoxBaseProps}>
                    <div>Hello world, here is a testing child</div>
                </UpsellPanel>
            );

            screen.getAllByText('Hello world, here is a testing child');
        });
    });

    describe('when screenview is narrow', () => {
        it('should not display the feature but a button to toggle their display', async () => {
            mockUseActiveBreakpoint.mockReturnValue({
                ...mockDefaultBreakpoints,
                viewportWidth: { ...mockDefaultBreakpoints.viewportWidth, ['<=small']: true },
            });
            render(<UpsellPanel {...upsellBoxBaseProps} />);

            // features should be hidden at first
            expect(screen.queryByText('10GB total storage')).toBeNull();
            expect(screen.queryByText('10 email addresses/aliases')).toBeNull();
            expect(screen.queryByText('Unlimited folders, labels, and filters')).toBeNull();

            const showBtn = screen.getByText('See plan features');
            fireEvent.click(showBtn);

            // features should be displayed
            expect(screen.getByText('10GB total storage'));
            expect(screen.getByText('10 email addresses/aliases'));
            expect(screen.getByText('Unlimited folders, labels, and filters'));

            const hideBtn = screen.getByText('Hide plan features');
            fireEvent.click(hideBtn);

            // features should be hidden again
            expect(screen.queryByText('10GB total storage')).toBeNull();
            expect(screen.queryByText('10 email addresses/aliases')).toBeNull();
            expect(screen.queryByText('Unlimited folders, labels, and filters')).toBeNull();
        });
    });
});
