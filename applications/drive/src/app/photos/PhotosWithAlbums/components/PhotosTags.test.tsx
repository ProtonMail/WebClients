import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PhotoTags } from '../../../store';
import { PhotosTags, type PhotosTagsProps } from './PhotosTags';

describe('PhotosTags', () => {
    const defaultProps: PhotosTagsProps = {
        selectedTag: ['all'],
        tags: [PhotoTags.Favorites, PhotoTags.Screenshots, PhotoTags.Videos],
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
        expect(onTagSelect).toHaveBeenCalledWith([PhotoTags.Favorites]);

        await user.click(screen.getByText('Screenshots'));
        expect(onTagSelect).toHaveBeenCalledWith([PhotoTags.Screenshots]);
    });

    it('handles "All" tag selection', async () => {
        const onTagSelect = jest.fn();
        render(<PhotosTags {...defaultProps} onTagSelect={onTagSelect} />);

        await user.click(screen.getByText('All'));
        expect(onTagSelect).toHaveBeenCalledWith(['all']);
    });

    it('combines Live Photos and Motion Photos correctly', () => {
        const props = {
            ...defaultProps,
            tags: [PhotoTags.LivePhotos, PhotoTags.MotionPhotos],
        };

        render(<PhotosTags {...props} />);

        const livePhotosButtons = screen.getAllByText('Live Photos');
        expect(livePhotosButtons).toHaveLength(1);
    });

    it('shows selected state correctly', () => {
        const props = {
            ...defaultProps,
            selectedTag: [PhotoTags.Favorites],
        };

        render(<PhotosTags {...props} />);

        const favoritesButton = screen.getByRole('button', { name: 'Favorites' });
        expect(favoritesButton).toHaveClass('is-selected');
    });

    it('handles Live Photos selection correctly', async () => {
        const onTagSelect = jest.fn();
        const props = {
            ...defaultProps,
            tags: [PhotoTags.LivePhotos],
            onTagSelect,
        };

        render(<PhotosTags {...props} />);

        await user.click(screen.getByText('Live Photos'));
        expect(onTagSelect).toHaveBeenCalledWith([PhotoTags.LivePhotos, PhotoTags.MotionPhotos]);
    });

    it('handles Motion Photos selection correctly', async () => {
        const onTagSelect = jest.fn();
        const props = {
            ...defaultProps,
            tags: [PhotoTags.MotionPhotos],
            onTagSelect,
        };

        render(<PhotosTags {...props} />);

        await user.click(screen.getByText('Live Photos'));
        expect(onTagSelect).toHaveBeenCalledWith([PhotoTags.LivePhotos, PhotoTags.MotionPhotos]);
    });
});
