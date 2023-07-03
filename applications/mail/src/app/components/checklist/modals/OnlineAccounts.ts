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
                    key: '33439e88-bc8c-480c-a40b-e8e5895eca6d',
                    name: 'Apple',
                    url: 'https://appleid.apple.com/',
                    img: apple,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '49bfd630-8841-41f5-a5ff-d5d93df71c8a',
                    name: 'Amazon',
                    url: 'https://www.amazon.com/gp/css/homepage.html',
                    img: amazon,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '2a4ad8aa-89fb-43ef-8dd0-02b3f893e60b',
                    name: 'Ebay',
                    url: 'https://signin.ebay.com/ws/eBayISAPI.dll?SignIn&ru=https://accountsettings.ebay.com/uas',
                    img: ebay,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'ccb732dc-0b77-4af1-a138-82f45e4acd66',
                    name: 'Facebook',
                    url: 'https://accountscenter.facebook.com/personal_info/contact_points',
                    img: facebook,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '0bfa717f-6b14-4c49-8dc5-d71e3f2a45df',
                    name: 'Github',
                    url: 'https://github.com/login',
                    img: github,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'f36e7c6e-0c0d-4032-87d8-4e9d1cd7736a',
                    name: 'Instagram',
                    url: 'https://www.instagram.com/accounts/login/',
                    img: instagram,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '0b729f27-30e1-4e6c-ad83-4f6a2fee291c',
                    name: 'Linkedin',
                    url: 'https://www.linkedin.com/mypreferences/d/manage-email-addresses',
                    img: linkedin,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '6a8ea310-4f50-45b0-a0e3-d624813d6b93',
                    name: 'Netflix',
                    url: 'https://www.netflix.com/YourAccount',
                    img: netflix,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '430a3bbc-ec40-46f8-a2ce-a81b7c2fac35',
                    name: 'Paypal',
                    url: 'https://www.paypal.com/myaccount/settings/',
                    img: paypal,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '4f6052d9-8788-456f-bf1f-febeeb5797d1',
                    name: 'Reddit',
                    url: 'https://www.reddit.com/login',
                    img: reddit,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'd110e02d-e086-4eb1-b16c-fd9b8e144842',
                    name: 'Spotify',
                    url: 'https://www.spotify.com/us/account/overview/',
                    img: spotify,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '6380a481-fe99-4924-8169-2972e4129fea',
                    name: 'Walmart',
                    url: 'https://www.walmart.com/account/login',
                    img: walmart,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'dc7f3c9f-cb7f-445b-b1ef-17165cb49f62',
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
                    key: '7c0beeb7-56f0-4a44-b366-c3c1062271bc',
                    name: 'American express',
                    url: 'https://www.americanexpress.com/en-us/account/login',
                    img: americanExpress,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'b9979051-e696-4535-86bc-e38167a4267f',
                    name: 'Bank of America',
                    url: 'https://secure.bankofamerica.com/login/sign-in/signOnV2Screen.go',
                    img: bankOfAmerica,
                    usOnly: true,
                    done: false,
                },
                {
                    key: '2b87b6d3-e223-486f-aa59-8a544eec16ca',
                    name: 'Capital One',
                    url: 'https://verified.capitalone.com/auth/signin',
                    img: capitalOne,
                    usOnly: true,
                    done: false,
                },
                {
                    key: '2b2c136c-f357-4556-a3a2-8ba7f4d426c6',
                    name: 'Chase',
                    url: 'https://www.chase.com/personal/for-you-login',
                    img: chase,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'd7d13fd8-e559-45a1-af8c-33288d7a1f6d',
                    name: 'Credit karma',
                    url: 'https://www.creditkarma.com/auth/logon',
                    img: creditKarma,
                    usOnly: true,
                    done: false,
                },
                {
                    key: '7d455816-d4b4-46ef-9e68-e90ff7f05fb8',
                    name: 'Discover',
                    url: 'https://portal.discover.com/customersvcs/universalLogin/ac_main',
                    img: discover,
                    usOnly: true,
                    done: false,
                },
                {
                    key: '2ea06f60-c9f0-4a63-a991-c4ea0da9d8ca',
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
                    key: '5b538c9e-4683-440d-85b3-0a367f478a8f',
                    name: 'Bestbuy',
                    url: 'https://www.bestbuy.com/identity/global/signin',
                    img: bestBuy,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'feab8e32-be92-4869-a3df-49ae72703c28',
                    name: 'Home Depot',
                    url: 'https://www.homedepot.com/auth/view/signin',
                    img: homeDepot,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'eca5bcd6-b3b7-4128-8e19-de1381a06cb5',
                    name: 'instacart',
                    url: 'https://www.instacart.com/login',
                    img: instacart,
                    usOnly: true,
                    done: false,
                },
                {
                    key: '8838d58e-b728-4122-8552-d3c13835145a',
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
                    key: '3220db33-d9dc-433f-a208-4936c95d1a59',
                    name: 'Disney plus',
                    url: 'https://www.disneyplus.com/oauth',
                    img: disneyPlus,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '0dfdccf2-72e0-42e2-a606-514f44bf2add',
                    name: 'Prime Video',
                    url: 'https://www.amazon.com/log/s?k=log+in',
                    img: primeVideo,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'e063e264-163d-48b7-b1bf-5600004a98f3',
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
                    key: '8d5e40da-cb03-47ec-9bd6-3943b82a03fc',
                    name: 'Dominos',
                    url: 'https://www.dominos.com/',
                    img: dominos,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'b06fefe4-00d4-441f-bf98-85b4b380e3c7',
                    name: 'Doordash',
                    url: 'https://www.doordash.com/consumer/login/',
                    img: doordash,
                    usOnly: true,
                    done: false,
                },
                {
                    key: '0b7e7246-8439-4092-be97-90bc0cae6f16',
                    name: 'Mcdonalds',
                    url: 'https://www.mcdonalds.com/us/en-us/my-account.html',
                    img: mcdonalds,
                    usOnly: true,
                    done: false,
                },
                {
                    key: '7a89a2f6-b3af-4a2f-9dd5-d27d57e84c96',
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
                    key: '7eec2872-a9e0-4068-9f30-d0ea5321e513',
                    name: 'Discord',
                    url: 'https://discord.com/',
                    img: discord,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '57d2a732-8ee6-4548-8b4e-7cd68d837e87',
                    name: 'Steam',
                    url: 'https://help.steampowered.com/en/login/',
                    img: steam,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'efd01c70-e8eb-44fd-8fc7-ad536afd1c4d',
                    name: 'Nintendo',
                    url: 'https://accounts.nintendo.com/login?',
                    img: nintendo,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '03021b1d-36db-497e-b968-f13a32218a13',
                    name: 'Playstation',
                    url: 'https://www.playstation.com/en-us/playstation-network/',
                    img: playStation,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '6930f6a0-6a08-4b52-9160-f7e957430f49',
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
                    key: '2c9b3779-669f-4204-a68c-a79e911e7b12',
                    name: 'Airbnb',
                    url: 'https://www.airbnb.com/login?redirect_url=/account-settings/personal-info',
                    img: airbnb,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'd27081b6-e6d2-4732-ac29-c9a5a09e4b59',
                    name: 'Booking.com',
                    url: 'https://www.booking.com/signin.en.html',
                    img: booking,
                    usOnly: false,
                    done: false,
                },
                {
                    key: 'b1a1d8a6-0848-43b1-a324-d4f9f874abb6',
                    name: 'Expedia',
                    url: 'https://www.expedia.com/',
                    img: expedia,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '85de00ad-7e9e-4b0b-af20-5991b2525241',
                    name: 'Hotels.com',
                    url: 'https://www.hotels.com/account?edit=contact-information',
                    img: hotels,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '06e54ebb-4258-4220-b62c-d5f859a13d81',
                    name: 'Lyft',
                    url: 'https://account.lyft.com/auth',
                    img: lyft,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'cc97a464-a09d-4ce8-b78c-26e50a2feaf6',
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
                    key: '38d3e980-e911-4639-9588-fe6d2adb5e70',
                    name: 'ATT',
                    url: 'https://www.att.com/my/',
                    img: att,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'f0392f1a-453d-4947-8573-8a7524f84ef2',
                    name: 'T-mobile',
                    url: 'https://account.t-mobile.com/',
                    img: tMobile,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'eadf77a5-b60d-4dc9-902b-35ee0f13f0ee',
                    name: 'Verizon',
                    url: 'https://secure.verizon.com/signin',
                    img: verizon,
                    usOnly: true,
                    done: false,
                },
                {
                    key: 'e1d879f4-2929-4a55-b4c5-010731867438',
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
                    key: '02f0ad79-abe4-494a-9201-298fb926953e',
                    name: 'Coinbase',
                    url: 'https://www.coinbase.com/signin',
                    img: coinbase,
                    usOnly: false,
                    done: false,
                },
                {
                    key: '9d712705-3abc-42dd-bdb8-d4273b5234b2',
                    name: 'Robinhood',
                    url: 'https://robinhood.com/login',
                    img: robinhood,
                    usOnly: true,
                    done: false,
                },
                {
                    key: '4439f98f-af2d-4158-9793-7bb9172e19d9',
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
