import { c } from 'ttag';

import type { IconComponent } from '@proton/icons/component';
import { IcHeart } from '@proton/icons/icons/IcHeart';
import { IcImage } from '@proton/icons/icons/IcImage';
import { IcImageStacked } from '@proton/icons/icons/IcImageStacked';
import { IcLink } from '@proton/icons/icons/IcLink';
import { IcLive } from '@proton/icons/icons/IcLive';
import { IcPanorama } from '@proton/icons/icons/IcPanorama';
import { IcRaw } from '@proton/icons/icons/IcRaw';
import { IcScreenshot } from '@proton/icons/icons/IcScreenshot';
import { IcUser } from '@proton/icons/icons/IcUser';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { IcVideoCamera } from '@proton/icons/icons/IcVideoCamera';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import clsx from '@proton/utils/clsx';

import { AlbumTag, type Tag } from '../../legacy/store';

const getTagLabelsWithIcon = (
    tag: Tag
): {
    title: string;
    subtitle: string;
    icon: IconComponent;
} => {
    switch (tag) {
        case PhotoTag.Favorites:
            return {
                title: c('Title').t`No favorites`,
                subtitle: c('Subtitle').t`Your favorited photos will appear here`,
                icon: IcHeart,
            };
        case PhotoTag.Screenshots:
            return {
                title: c('Title').t`No screenshots`,
                subtitle: c('Subtitle').t`Your screenshots will appear here`,
                icon: IcScreenshot,
            };
        case PhotoTag.Videos:
            return {
                title: c('Title').t`No videos`,
                subtitle: c('Subtitle').t`Your videos will appear here`,
                icon: IcVideoCamera,
            };
        case PhotoTag.LivePhotos:
        case PhotoTag.MotionPhotos:
            return {
                title: c('Title').t`No Live Photos`,
                subtitle: c('Subtitle').t`Your Live Photos will appear here`,
                icon: IcLive,
            };
        case PhotoTag.Selfies:
            return {
                title: c('Title').t`No selfies`,
                subtitle: c('Subtitle').t`Your selfies photos will appear here`,
                icon: IcUser,
            };
        case PhotoTag.Portraits:
            return {
                title: c('Title').t`No portraits`,
                subtitle: c('Subtitle').t`Your portraits photos will appear here`,
                icon: IcUserCircle,
            };
        case PhotoTag.Bursts:
            return {
                title: c('Title').t`No bursts`,
                subtitle: c('Subtitle').t`Your photo bursts will appear here`,
                icon: IcImageStacked,
            };
        case PhotoTag.Panoramas:
            return {
                title: c('Title').t`No panorama`,
                subtitle: c('Subtitle').t`Your panorama photos will appear here`,
                icon: IcPanorama,
            };
        case PhotoTag.Raw:
            return {
                title: c('Title').t`No RAW`,
                subtitle: c('Subtitle').t`Your RAW photos will appear here`,
                icon: IcRaw,
            };
        case AlbumTag.Shared:
            return {
                title: c('Title').t`No shared albums`,
                subtitle: c('Subtitle').t`Albums you've shared will appear here`,
                icon: IcLink,
            };
        case AlbumTag.SharedWithMe:
            return {
                title: c('Title').t`No albums shared with me`,
                subtitle: c('Subtitle').t`Albums shared with you will appear here`,
                icon: IcUsers,
            };
        default:
            return {
                title: c('Title').t`No photos`,
                subtitle: c('Subtitle').t`Your tagged photos will appear here`,
                icon: IcImage,
            };
    }
};

export interface EmptyTagViewProps {
    tag: Tag;
}

export const EmptyTagView = ({ tag }: EmptyTagViewProps) => {
    const { icon: Icon, title, subtitle } = getTagLabelsWithIcon(tag);
    return (
        <div className="m-auto flex flex-column items-center justify-center gap-2">
            <Icon className={clsx(tag === PhotoTag.Favorites ? 'color-danger' : 'color-weak')} size={15} />
            <h3 className="text-bold text-xxl">{title}</h3>
            <h4 className="text-lg">{subtitle}</h4>
        </div>
    );
};
