import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Pagination } from './Pagination';

describe('Pagination', () => {
    it('should display the current page and the total pages', () => {
        render(<Pagination totalPages={10} currentPage={0} onPageChange={vi.fn()} />);

        expect(screen.getByText('1/10')).toBeInTheDocument();
    });

    it('should allow for nagivating to the previous page', async () => {
        const onPageChange = vi.fn();

        render(<Pagination totalPages={10} currentPage={4} onPageChange={onPageChange} />);

        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: 'Previous page' }));

        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('should allow for nagivating to the next page', async () => {
        const onPageChange = vi.fn();

        render(<Pagination totalPages={10} currentPage={4} onPageChange={onPageChange} />);

        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: 'Next page' }));

        expect(onPageChange).toHaveBeenCalledWith(5);
    });

    it('should not allow for nagivating to the previous page if the current page is the first page', async () => {
        const onPageChange = vi.fn();

        render(<Pagination totalPages={10} currentPage={0} onPageChange={onPageChange} />);

        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: 'Previous page' }));

        expect(onPageChange).not.toHaveBeenCalled();
    });

    it('should not allow for nagivating to the next page if the current page is the last page', async () => {
        const onPageChange = vi.fn();

        render(<Pagination totalPages={10} currentPage={9} onPageChange={onPageChange} />);

        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: 'Next page' }));

        expect(onPageChange).not.toHaveBeenCalled();
    });
});
