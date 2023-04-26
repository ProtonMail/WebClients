import { c } from 'ttag';

import airbnb from '@proton/styles/assets/img/brand/airbnb.svg';
import amazon from '@proton/styles/assets/img/brand/amazon.svg';
import americanExpress from '@proton/styles/assets/img/brand/american-express.svg';
import apple from '@proton/styles/assets/img/brand/apple.svg';
import att from '@proton/styles/assets/img/brand/att.svg';
import bankOfAmerica from '@proton/styles/assets/img/brand/bank-of-america.svg';
import bestBuy from '@proton/styles/assets/img/brand/best-buy.svg';
import binance from '@proton/styles/assets/img/brand/binance.svg';
import booking from '@proton/styles/assets/img/brand/booking.svg';
import capitalOne from '@proton/styles/assets/img/brand/capital-one.svg';
import chase from '@proton/styles/assets/img/brand/chase.svg';
import coinbase from '@proton/styles/assets/img/brand/coinbase.svg';
import creditKarma from '@proton/styles/assets/img/brand/credit-karma.svg';
import discord from '@proton/styles/assets/img/brand/discord.svg';
import discover from '@proton/styles/assets/img/brand/discover.svg';
import disneyPlus from '@proton/styles/assets/img/brand/disney-plus.svg';
import dominos from '@proton/styles/assets/img/brand/dominos-pizza.svg';
import doordash from '@proton/styles/assets/img/brand/doordash.svg';
import ebay from '@proton/styles/assets/img/brand/ebay.svg';
import expedia from '@proton/styles/assets/img/brand/expedia.svg';
import facebook from '@proton/styles/assets/img/brand/facebook.svg';
import github from '@proton/styles/assets/img/brand/github.svg';
import homeDepot from '@proton/styles/assets/img/brand/home-depot.svg';
import hotels from '@proton/styles/assets/img/brand/hotels.svg';
import instacart from '@proton/styles/assets/img/brand/instacart.svg';
import instagram from '@proton/styles/assets/img/brand/instagram.svg';
import linkedin from '@proton/styles/assets/img/brand/linkedin.svg';
import lyft from '@proton/styles/assets/img/brand/lyft.svg';
import mcdonalds from '@proton/styles/assets/img/brand/mcdonald.svg';
import netflix from '@proton/styles/assets/img/brand/netflix.svg';
import nintendo from '@proton/styles/assets/img/brand/nintendo.svg';
import paypal from '@proton/styles/assets/img/brand/paypal.svg';
import playStation from '@proton/styles/assets/img/brand/playstation.svg';
import primeVideo from '@proton/styles/assets/img/brand/prime-video.svg';
import reddit from '@proton/styles/assets/img/brand/reddit.svg';
import robinhood from '@proton/styles/assets/img/brand/robinhood.svg';
import spotify from '@proton/styles/assets/img/brand/spotify.svg';
import steam from '@proton/styles/assets/img/brand/steam.svg';
import substack from '@proton/styles/assets/img/brand/substack.svg';
import tMobile from '@proton/styles/assets/img/brand/t-mobile.svg';
import target from '@proton/styles/assets/img/brand/target.svg';
import twitch from '@proton/styles/assets/img/brand/twitch.svg';
import uber from '@proton/styles/assets/img/brand/uber.svg';
import verizon from '@proton/styles/assets/img/brand/verizon.svg';
import walmart from '@proton/styles/assets/img/brand/walmart.svg';
import wellsFargo from '@proton/styles/assets/img/brand/wells-fargo.svg';
import xbox from '@proton/styles/assets/img/brand/xbox.svg';
import xfinity from '@proton/styles/assets/img/brand/xfinity.svg';

export interface ServiceDetails {
    key: string;
    name: string;
    url: string;
    img: string;
    usOnly: boolean;
    done: boolean;
}

interface OnlineAccountGroup {
    groupName: string;
    services: ServiceDetails[];
}

export const getOnlineAccounts = (): OnlineAccountGroup[] => {
    return [
        {
            groupName: c('Online Accounts Name').t`Most popular`,
            services: [
                {
                    key: 'apple',
                    name: 'Apple',
                    url: 'https://appleid.apple.com/',
                    img: apple,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'amazon',
                    name: 'Amazon',
                    url: 'https://www.amazon.com/gp/css/homepage.html',
                    img: amazon,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'ebay',
                    name: 'Ebay',
                    url: 'https://signin.ebay.com/ws/eBayISAPI.dll?SignIn&ru=https://accountsettings.ebay.com/uas',
                    img: ebay,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'facebook',
                    name: 'Facebook',
                    url: 'https://accountscenter.facebook.com/personal_info/contact_points',
                    img: facebook,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'github',
                    name: 'Github',
                    url: 'https://github.com/login',
                    img: github,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'instagram',
                    name: 'Instagram',
                    url: 'https://www.instagram.com/accounts/login/',
                    img: instagram,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'linkedin',
                    name: 'Linkedin',
                    url: 'https://www.linkedin.com/mypreferences/d/manage-email-addresses',
                    img: linkedin,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'netflix',
                    name: 'Netflix',
                    url: 'https://www.netflix.com/YourAccount',
                    img: netflix,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'paypal',
                    name: 'Paypal',
                    url: 'https://www.paypal.com/myaccount/settings/',
                    img: paypal,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'reddit',
                    name: 'Reddit',
                    url: 'https://www.reddit.com/login',
                    img: reddit,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'spotify',
                    name: 'Spotify',
                    url: 'https://www.spotify.com/us/account/overview/',
                    img: spotify,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'walmart',
                    name: 'Walmart',
                    url: 'https://www.walmart.com/account/login',
                    img: walmart,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'substack',
                    name: 'Substack',
                    url: 'https://substack.com/sign-in',
                    img: substack,
                    usOnly: false,
                    done: false,
                },
            ],
        },
        {
            groupName: c('Online Accounts Name').t`Banking`,
            services: [
                {
                    key: 'american-express',
                    name: 'American express',
                    url: 'https://www.americanexpress.com/en-us/account/login',
                    img: americanExpress,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'bank-of-america',
                    name: 'Bank of America',
                    url: 'https://secure.bankofamerica.com/login/sign-in/signOnV2Screen.go',
                    img: bankOfAmerica,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'capital-one',
                    name: 'Capital One',
                    url: 'https://verified.capitalone.com/auth/signin',
                    img: capitalOne,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'chase',
                    name: 'Chase',
                    url: 'https://www.chase.com/personal/for-you-login',
                    img: chase,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'credit-karma',
                    name: 'Credit karma',
                    url: 'https://www.creditkarma.com/auth/logon',
                    img: creditKarma,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'discover',
                    name: 'Discover',
                    url: 'https://portal.discover.com/customersvcs/universalLogin/ac_main',
                    img: discover,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'wells-fargo',
                    name: 'Wells Fargo',
                    url: 'https://connect.secure.wellsfargo.com/auth/login/present',
                    img: wellsFargo,
                    usOnly: true,
                    done: false,
                },
            ],
        },
        {
            groupName: c('Online Accounts Name').t`E-commerce and Retail`,
            services: [
                {
                    key: 'bestbuy',
                    name: 'Bestbuy',
                    url: 'https://www.bestbuy.com/identity/global/signin',
                    img: bestBuy,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'home-depot',
                    name: 'Home Depot',
                    url: 'https://www.homedepot.com/auth/view/signin',
                    img: homeDepot,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'instacart',
                    name: 'instacart',
                    url: 'https://www.instacart.com/login',
                    img: instacart,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'target',
                    name: 'Target',
                    url: 'https://www.target.com/account',
                    img: target,
                    usOnly: true,
                    done: false,
                },
            ],
        },
        {
            groupName: c('Online Accounts Name').t`Entertainment`,
            services: [
                {
                    key: 'disney-plus',
                    name: 'Disney plus',
                    url: 'https://www.disneyplus.com/oauth',
                    img: disneyPlus,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'prime-video',
                    name: 'Prime Video',
                    url: 'https://www.amazon.com/log/s?k=log+in',
                    img: primeVideo,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'twitch',
                    name: 'Twitch',
                    url: 'https://www.twitch.tv/settings/security',
                    img: twitch,
                    usOnly: false,
                    done: false,
                },
            ],
        },
        {
            groupName: c('Online Accounts Name').t`Food and beverage`,
            services: [
                {
                    key: 'dominos',
                    name: 'Dominos',
                    url: 'https://www.dominos.com/',
                    img: dominos,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'doordash',
                    name: 'Doordash',
                    url: 'https://www.doordash.com/consumer/login/',
                    img: doordash,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'mcdonalds',
                    name: 'Mcdonalds',
                    url: 'https://www.mcdonalds.com/us/en-us/my-account.html',
                    img: mcdonalds,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'uber-eats',
                    name: 'Uber Eats',
                    url: 'http://ubereats.com/login-redirect/',
                    img: uber,
                    usOnly: false,
                    done: false,
                },
            ],
        },
        {
            groupName: c('Online Accounts Name').t`Gaming`,
            services: [
                {
                    key: 'discord',
                    name: 'Discord',
                    url: 'https://discord.com/',
                    img: discord,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'steam',
                    name: 'Steam',
                    url: 'https://help.steampowered.com/en/login/',
                    img: steam,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'nintendo',
                    name: 'Nintendo',
                    url: 'https://accounts.nintendo.com/login?',
                    img: nintendo,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'playstation',
                    name: 'Playstation',
                    url: 'https://www.playstation.com/en-us/playstation-network/',
                    img: playStation,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'xbox',
                    name: 'Xbox',
                    url: 'https://www.xbox.com/en-MY/live',
                    img: xbox,
                    usOnly: false,
                    done: false,
                },
            ],
        },
        {
            groupName: c('Online Accounts Name').t`Travel`,
            services: [
                {
                    key: 'airbnb',
                    name: 'Airbnb',
                    url: 'https://www.airbnb.com/login?redirect_url=/account-settings/personal-info',
                    img: airbnb,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'booking',
                    name: 'Booking.com',
                    url: 'https://www.booking.com/signin.en.html',
                    img: booking,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'expedia',
                    name: 'Expedia',
                    url: 'https://www.expedia.com/',
                    img: expedia,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'hotels',
                    name: 'Hotels.com',
                    url: 'https://www.hotels.com/account?edit=contact-information',
                    img: hotels,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'lyft',
                    name: 'Lyft',
                    url: 'https://account.lyft.com/auth',
                    img: lyft,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'uber',
                    name: 'Uber',
                    url: 'http://ubereats.com/login-redirect/',
                    img: uber,
                    usOnly: false,
                    done: false,
                },
            ],
        },
        {
            groupName: c('Online Accounts Name').t`Utilities`,
            services: [
                {
                    key: 'att',
                    name: 'ATT',
                    url: 'https://www.att.com/my/',
                    img: att,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 't-mobile',
                    name: 'T-mobile',
                    url: 'https://account.t-mobile.com/',
                    img: tMobile,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'verizon',
                    name: 'Verizon',
                    url: 'https://secure.verizon.com/signin',
                    img: verizon,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'xfinity',
                    name: 'Xfinity',
                    url: 'https://login.xfinity.com/login',
                    img: xfinity,
                    usOnly: true,
                    done: false,
                },
            ],
        },
        {
            groupName: c('Online Accounts Name').t`Crypto`,
            services: [
                {
                    key: 'coinbase',
                    name: 'Coinbase',
                    url: 'https://www.coinbase.com/signin',
                    img: coinbase,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'robinhood',
                    name: 'Robinhood',
                    url: 'https://robinhood.com/login',
                    img: robinhood,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'binance',
                    name: 'Binance',
                    url: 'https://accounts.binance.com/en/login?loginChannel=faq&return_to=aHR0cHM6Ly93d3cuYmluYW5jZS5jb20vZW4vc3VwcG9ydC9mYXEvaG93LXRvLWNoYW5nZS1hY2NvdW50LWVtYWlsLTExNTAwMzc4NDg3MQ%3D%3D',
                    img: binance,
                    usOnly: false,
                    done: false,
                },
            ],
        },
    ];
};
