import amazon from '@proton/styles/assets/img/brand/amazon.svg';
import chase from '@proton/styles/assets/img/brand/chase.svg';
import instagram from '@proton/styles/assets/img/brand/instagram.svg';
import linkedin from '@proton/styles/assets/img/brand/linkedin.svg';
import netflix from '@proton/styles/assets/img/brand/netflix.svg';
import reddit from '@proton/styles/assets/img/brand/reddit.svg';
import steam from '@proton/styles/assets/img/brand/steam.svg';
import twitter from '@proton/styles/assets/img/brand/twitter-x.svg';

export type OnlineServicesKey =
    | 'amazon'
    | 'chase'
    | 'instagram'
    | 'linkedin'
    | 'netflix'
    | 'reddit'
    | 'steam'
    | 'twitter';

export interface OnlineService {
    key: OnlineServicesKey;
    /** Brand name */
    name: string;
    /** Login URL of the online service */
    url: string;
    /** Brand logo */
    img: string;
    mostPopular?: boolean;
}

export const ONLINE_SERVICES: OnlineService[] = [
    {
        key: 'instagram',
        name: 'Instagram',
        url: 'https://www.instagram.com/accounts/login/',
        img: instagram,
        mostPopular: true,
    },
    {
        key: 'twitter',
        name: 'Twitter',
        url: 'https://x.com/settings/account',
        img: twitter,
        mostPopular: true,
    },
    {
        key: 'reddit',
        name: 'Reddit',
        url: 'https://www.reddit.com/login',
        img: reddit,
        mostPopular: true,
    },
    {
        key: 'netflix',
        name: 'Netflix',
        url: 'https://www.netflix.com/YourAccount',
        img: netflix,
        mostPopular: true,
    },
    {
        key: 'linkedin',
        name: 'Linkedin',
        url: 'https://www.linkedin.com/mypreferences/d/manage-email-addresses',
        img: linkedin,
        mostPopular: true,
    },
    {
        key: 'amazon',
        name: 'Amazon',
        url: 'https://www.amazon.com/gp/css/account/info/view.html',
        img: amazon,
        mostPopular: true,
    },
    {
        key: 'steam',
        name: 'Steam',
        url: 'https://help.steampowered.com/en/login/',
        img: steam,
    },
    {
        key: 'chase',
        name: 'Chase',
        url: 'https://www.chase.com/personal/for-you-login',
        img: chase,
    },
];
