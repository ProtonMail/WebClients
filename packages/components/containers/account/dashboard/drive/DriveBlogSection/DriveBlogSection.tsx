import { c } from 'ttag';

import { getBlogURL } from '@proton/shared/lib/helpers/url';

import DashboardBlogSection from '../../shared/DashboardBlogSection/DashboardBlogSection';
import appleIcloud from './illustrations/apple-icloud.jpg';
import backupYourFiles from './illustrations/backup-your-files.jpg';
import deleteGooglePhotos from './illustrations/delete-google-photos.jpg';
import familyPhotos from './illustrations/family-photos.jpg';
import sharePhotos from './illustrations/share-photos.jpg';
import storageCapacity from './illustrations/storage-capacity.jpg';

interface BlogPost {
    title: () => string;
    description: () => string;
    image: string;
    link: string;
}

const blogPosts: BlogPost[] = [
    {
        title: () => c('Blog').t`Storage capacity explained`,
        description: () =>
            c('Blog')
                .t`Learn how many GB are in a TB and discover the best way to securely store and share your files — no matter their size.`,
        image: storageCapacity,
        link: getBlogURL('/how-many-gb-in-a-tb-storage-capacity'),
    },
    {
        title: () => c('Blog').t`5 ways to backup your files`,
        description: () =>
            c('Blog')
                .t`Learn how to back up your files to the cloud or on an external drive while keeping your data secure.`,
        image: backupYourFiles,
        link: getBlogURL('/how-to-back-up-files'),
    },
    {
        title: () => c('Blog').t`Share photos online privately`,
        description: () =>
            c('Blog')
                .t`The most secure way to send pictures is with end-to-end encryption. Here are four ways to store and share photos privately.`,
        image: sharePhotos,
        link: getBlogURL('/share-photos-online-privately'),
    },
    {
        title: () => c('Blog').t`DeGoogle your life`,
        description: () =>
            c('Blog').t`Find out how to delete photos from Google Photos and use a private cloud storage app instead.`,
        image: deleteGooglePhotos,
        link: getBlogURL('/delete-all-photos-from-google-photos'),
    },
    {
        title: () => c('Blog').t`Apple can see much of what you store in iCloud`,
        description: () => c('Blog').t`iCloud is not private by default. Here's what Apple can see in iCloud.`,
        image: appleIcloud,
        link: getBlogURL('/apple-icloud-privacy'),
    },
    {
        title: () => c('Blog').t`Your family photos are training AI, and here’s how to stop it`,
        description: () => c('Blog').t`Learn how Big Tech uses family photos to train AI, how it affects you.`,
        image: familyPhotos,
        link: getBlogURL('/family-photos-ai-risks'),
    },
];

const DriveBlogSection = () => {
    return <DashboardBlogSection posts={blogPosts} title={c('Title').t`Deep dive into cloud storage blog posts`} />;
};

export default DriveBlogSection;
