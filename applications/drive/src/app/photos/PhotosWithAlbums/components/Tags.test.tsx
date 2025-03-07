import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { PhotosTags, type PhotosTagsProps } from './Tags';

describe('PhotosTags', () => {
    const defaultProps: PhotosTagsProps = {
        selectedTags: [PhotoTag.All],
        tags: [PhotoTag.All, PhotoTag.Favorites, PhotoTag.Screenshots, PhotoTag.Videos],
        onTagSelect: jest.fn(),
    };

    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all buttons correctly', () => {
        render(<PhotosTags {...defaultProps} />);

        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('Favorites')).toBeInTheDocument();
        expect(screen.getByText('Screenshots')).toBeInTheDocument();
        expect(screen.getByText('Videos')).toBeInTheDocument();
    });

    it('handles tag selection correctly', async () => {
        const onTagSelect = jest.fn();
        render(<PhotosTags {...defaultProps} onTagSelect={onTagSelect} />);

        await user.click(screen.getByText('Favorites'));
        expect(onTagSelect).toHaveBeenCalledWith([PhotoTag.Favorites]);

        await user.click(screen.getByText('Screenshots'));
        expect(onTagSelect).toHaveBeenCalledWith([PhotoTag.Screenshots]);
    });

    it('handles "All" tag selection', async () => {
        const onTagSelect = jest.fn();
        render(<PhotosTags {...defaultProps} onTagSelect={onTagSelect} />);

        await user.click(screen.getByText('All'));
        expect(onTagSelect).toHaveBeenCalledWith([PhotoTag.All]);
    });

    it('combines Live Photos and Motion Photos correctly', () => {
        const props = {
            ...defaultProps,
            tags: [PhotoTag.LivePhotos, PhotoTag.MotionPhotos],
        };

        render(<PhotosTags {...props} />);

        const livePhotosButtons = screen.getAllByText('Live Photos');
        expect(livePhotosButtons).toHaveLength(1);
    });

    it('shows selected state correctly', () => {
        const props = {
            ...defaultProps,
            selectedTags: [PhotoTag.Favorites],
        };

        render(<PhotosTags {...props} />);

        const favoritesButton = screen.getByRole('button', { name: 'Favorites' });
        expect(favoritesButton).toHaveClass('is-active');
    });

    it('handles Live Photos selection correctly', async () => {
        const onTagSelect = jest.fn();
        const props = {
            ...defaultProps,
            tags: [PhotoTag.LivePhotos],
            onTagSelect,
        };

        render(<PhotosTags {...props} />);

        await user.click(screen.getByText('Live Photos'));
        expect(onTagSelect).toHaveBeenCalledWith([PhotoTag.LivePhotos, PhotoTag.MotionPhotos]);
    });

    it('handles Motion Photos selection correctly', async () => {
        const onTagSelect = jest.fn();
        const props = {
            ...defaultProps,
            tags: [PhotoTag.MotionPhotos],
            onTagSelect,
        };

        render(<PhotosTags {...props} />);

        await user.click(screen.getByText('Live Photos'));
        expect(onTagSelect).toHaveBeenCalledWith([PhotoTag.LivePhotos, PhotoTag.MotionPhotos]);
    });
});
