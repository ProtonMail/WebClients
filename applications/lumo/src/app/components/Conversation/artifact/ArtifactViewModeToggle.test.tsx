import { fireEvent, render, screen } from '@testing-library/react';

import { ArtifactViewModeToggle } from './ArtifactViewModeToggle';

describe('ArtifactViewModeToggle', () => {
    it('calls onChange when preview or code is selected', () => {
        const onChange = jest.fn();

        render(<ArtifactViewModeToggle mode="preview" onChange={onChange} />);

        fireEvent.click(screen.getByRole('button', { name: 'Code' }));
        expect(onChange).toHaveBeenCalledWith('code');

        fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
        expect(onChange).toHaveBeenCalledWith('preview');
    });

    it('marks the active mode with aria-pressed', () => {
        render(<ArtifactViewModeToggle mode="code" onChange={jest.fn()} />);

        expect(screen.getByRole('button', { name: 'Preview' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
    });
});
