import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { IconComponentProps } from '@proton/icons/component';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';

import { OptionButton } from './OptionButton';

type OptionButtonProps = Parameters<typeof OptionButton>[0];

const CheckmarkWithAlt = (props: Pick<IconComponentProps, 'size' | 'style'>) => (
    <IcCheckmark {...props} alt="Selected" />
);

const renderOptionButton = (props: Partial<OptionButtonProps> = {}) =>
    render(<OptionButton label="English" showIcon={false} onClick={vi.fn()} {...props} />);

describe('OptionButton', () => {
    it('runs its action on click', async () => {
        const onClick = vi.fn();
        renderOptionButton({ onClick });

        await userEvent.setup().click(screen.getByRole('button', { name: 'English' }));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['Enter', '{Enter}'],
        ['Space', ' '],
    ])('runs its action on %s', async (_key, keys) => {
        const onClick = vi.fn();
        renderOptionButton({ onClick });
        const user = userEvent.setup();

        await user.tab();
        await user.keyboard(keys);

        expect(screen.getByRole('button', { name: 'English' })).toHaveFocus();
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('announces only the selected option of a single-choice list as selected', () => {
        const languages = ['English', 'French', 'German'];
        const selectedLanguage = 'French';

        render(
            <div role="listbox" aria-label="Spoken language">
                {languages.map((language) => {
                    const isSelected = language === selectedLanguage;
                    return (
                        <OptionButton
                            key={language}
                            label={language}
                            showIcon={isSelected}
                            onClick={vi.fn()}
                            // oxlint-disable-next-line jsx-a11y/role-has-required-aria-props -- aria-selected is set by OptionButton from ariaSelected
                            role="option"
                            ariaSelected={isSelected}
                            iconOnTheRight
                        />
                    );
                })}
            </div>
        );

        const listbox = screen.getByRole('listbox', { name: 'Spoken language' });

        expect(within(listbox).getByRole('option', { name: 'French', selected: true })).toBeInTheDocument();
        expect(within(listbox).getByRole('option', { name: 'English', selected: false })).toBeInTheDocument();
        expect(within(listbox).getByRole('option', { name: 'German', selected: false })).toBeInTheDocument();
    });

    it('cannot be activated by click or keyboard when disabled', async () => {
        const onClick = vi.fn();
        renderOptionButton({ onClick, disabled: true });
        const button = screen.getByRole('button', { name: 'English' });
        const user = userEvent.setup();

        await user.click(button);
        await user.tab();
        await user.keyboard('{Enter}');
        await user.keyboard(' ');

        expect(button).toBeDisabled();
        expect(button).not.toHaveFocus();
        expect(onClick).not.toHaveBeenCalled();
    });

    describe.each([
        { side: 'left', iconOnTheRight: false, selectedName: 'Selected English', loadingName: 'Loading English' },
        { side: 'right', iconOnTheRight: true, selectedName: 'English Selected', loadingName: 'English Loading' },
    ])('with its icon on the $side', ({ iconOnTheRight, selectedName, loadingName }) => {
        it('shows its icon only when asked to', () => {
            const { rerender } = renderOptionButton({ Icon: CheckmarkWithAlt, showIcon: true, iconOnTheRight });

            expect(screen.getByRole('button')).toHaveAccessibleName(selectedName);

            rerender(
                <OptionButton
                    label="English"
                    showIcon={false}
                    onClick={vi.fn()}
                    Icon={CheckmarkWithAlt}
                    iconOnTheRight={iconOnTheRight}
                />
            );

            expect(screen.getByRole('button')).toHaveAccessibleName('English');
        });

        it('shows the loader in place of its icon while loading', () => {
            renderOptionButton({ Icon: CheckmarkWithAlt, showIcon: true, loading: true, iconOnTheRight });

            expect(screen.getByRole('button')).toHaveAccessibleName(loadingName);
        });
    });
});
