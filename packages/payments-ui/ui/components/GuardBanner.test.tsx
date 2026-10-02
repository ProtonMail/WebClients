import { render, screen } from '@testing-library/react';

import { GUARD_ERROR_CODES, type GuardError } from '@proton/payments/core/subscription/guard';

import { GuardBanner } from './GuardBanner';

describe('GuardBanner', () => {
    it('renders every guard error in one view', () => {
        render(
            <GuardBanner
                errors={[
                    { Code: GUARD_ERROR_CODES.TOO_FEW_MEMBERS, Message: 'raw 1' },
                    { Code: GUARD_ERROR_CODES.TOO_FEW_DOMAINS, Message: 'raw 2' },
                ]}
            />
        );

        const status = screen.getByTestId('banner');

        expect(status.querySelectorAll('li')).toHaveLength(2);
        expect(status.textContent).toContain('To complete the action, fix the following:');
        expect(status.textContent).not.toContain('raw 1');
        expect(status.textContent).not.toContain('raw 2');
    });

    it('shows a single generic message when no error is mapped', () => {
        render(
            <GuardBanner
                errors={[
                    { Code: 9999991 as GuardError['Code'], Message: 'raw 1' },
                    { Code: 9999992 as GuardError['Code'], Message: 'raw 2' },
                ]}
            />
        );

        const status = screen.getByTestId('banner');

        expect(status.querySelectorAll('li')).toHaveLength(1);
        expect(status.textContent).toContain('can’t be completed');
        expect(status.textContent).not.toContain('fix the following');
        expect(status.textContent).not.toContain('raw 1');
        expect(status.textContent).not.toContain('raw 2');
    });

    it('drops unmapped errors when at least one error is mapped', () => {
        render(
            <GuardBanner
                errors={[
                    { Code: GUARD_ERROR_CODES.TOO_FEW_MEMBERS, Message: 'raw 1' },
                    { Code: 9999999 as GuardError['Code'], Message: 'raw 2' },
                ]}
            />
        );

        const status = screen.getByTestId('banner');

        expect(status.querySelectorAll('li')).toHaveLength(1);
        expect(status.textContent).not.toContain('can’t be completed');
        expect(status.textContent).not.toContain('raw 2');
    });

    it('announces the banner to assistive technology and does not rely on colour alone', () => {
        const { container } = render(<GuardBanner errors={[{ Code: 9999999 as GuardError['Code'], Message: 'x' }]} />);
        const status = screen.getByTestId('banner');

        expect(status).toHaveAttribute('aria-live', 'polite');
        expect(container.querySelector('svg')).toBeTruthy();
        expect(status.textContent).toContain('can’t be completed');
    });

    it('renders nothing when there are no errors', () => {
        const { container } = render(<GuardBanner errors={[]} />);

        expect(container.firstChild).toBeNull();
    });

    it('supports inline and block variants, without opening any modal', () => {
        const errors: GuardError[] = [{ Code: GUARD_ERROR_CODES.TOO_FEW_MEMBERS, Message: 'x' }];
        const { rerender } = render(<GuardBanner errors={errors} variant="inline" />);

        expect(screen.getByTestId('banner').className).toContain('text-sm');

        rerender(<GuardBanner errors={errors} variant="block" />);

        expect(screen.getByTestId('banner').className).not.toContain('text-sm');
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });
});
