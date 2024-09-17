import type { CountryTimezoneShortFormat } from '@proton/shared/lib/date/singleCountryTimezoneDatabase';
import airbnb from '@proton/styles/assets/img/brand/airbnb.svg';
import aliexpress from '@proton/styles/assets/img/brand/aliexpress.svg';
import amazon from '@proton/styles/assets/img/brand/amazon.svg';
import americanExpress from '@proton/styles/assets/img/brand/american-express.svg';
import apple from '@proton/styles/assets/img/brand/apple.svg';
import att from '@proton/styles/assets/img/brand/att.svg';
import bankOfAmerica from '@proton/styles/assets/img/brand/bank-of-america.svg';
import banquePopulaire from '@proton/styles/assets/img/brand/banque-populaire.svg';
import barclays from '@proton/styles/assets/img/brand/barclays.svg';
import bbva from '@proton/styles/assets/img/brand/bbva.svg';
import bestBuy from '@proton/styles/assets/img/brand/best-buy.svg';
import binance from '@proton/styles/assets/img/brand/binance.svg';
import bnpParibas from '@proton/styles/assets/img/brand/bnp-paribas.svg';
import booking from '@proton/styles/assets/img/brand/booking.svg';
import caixaBank from '@proton/styles/assets/img/brand/caixa-bank.svg';
import capitalOne from '@proton/styles/assets/img/brand/capital-one.svg';
import chase from '@proton/styles/assets/img/brand/chase.svg';
import coinbase from '@proton/styles/assets/img/brand/coinbase.svg';
import creditAgricole from '@proton/styles/assets/img/brand/credit-agricole.svg';
import creditKarma from '@proton/styles/assets/img/brand/credit-karma.svg';
import deutscheBank from '@proton/styles/assets/img/brand/deutsche-bank.svg';
import discord from '@proton/styles/assets/img/brand/discord.svg';
import discover from '@proton/styles/assets/img/brand/discover.svg';
import disneyPlus from '@proton/styles/assets/img/brand/disney-plus.svg';
import dominos from '@proton/styles/assets/img/brand/dominos-pizza.svg';
import doordash from '@proton/styles/assets/img/brand/doordash.svg';
import dzBank from '@proton/styles/assets/img/brand/dz-bank.svg';
import ebay from '@proton/styles/assets/img/brand/ebay.svg';
import expedia from '@proton/styles/assets/img/brand/expedia.svg';
import facebook from '@proton/styles/assets/img/brand/facebook.svg';
import github from '@proton/styles/assets/img/brand/github.svg';
import homeDepot from '@proton/styles/assets/img/brand/home-depot.svg';
import hotels from '@proton/styles/assets/img/brand/hotels.svg';
import hsbc from '@proton/styles/assets/img/brand/hsbc.svg';
import instacart from '@proton/styles/assets/img/brand/instacart.svg';
import instagram from '@proton/styles/assets/img/brand/instagram.svg';
import kfw from '@proton/styles/assets/img/brand/kfw.svg';
import linkedin from '@proton/styles/assets/img/brand/linkedin.svg';
import lloyds from '@proton/styles/assets/img/brand/lloyds.svg';
import lyft from '@proton/styles/assets/img/brand/lyft.svg';
import mcdonalds from '@proton/styles/assets/img/brand/mcdonald.svg';
import netflix from '@proton/styles/assets/img/brand/netflix.svg';
import nintendo from '@proton/styles/assets/img/brand/nintendo.svg';
import paypal from '@proton/styles/assets/img/brand/paypal.svg';
import playStation from '@proton/styles/assets/img/brand/playstation.svg';
import primeVideo from '@proton/styles/assets/img/brand/prime-video.svg';
import raiffeisen from '@proton/styles/assets/img/brand/raiffeisen.svg';
import reddit from '@proton/styles/assets/img/brand/reddit.svg';
import robinhood from '@proton/styles/assets/img/brand/robinhood.svg';
import santander from '@proton/styles/assets/img/brand/santander.svg';
import spotify from '@proton/styles/assets/img/brand/spotify.svg';
import steam from '@proton/styles/assets/img/brand/steam.svg';
import substack from '@proton/styles/assets/img/brand/substack.svg';
import tMobile from '@proton/styles/assets/img/brand/t-mobile.svg';
import target from '@proton/styles/assets/img/brand/target.svg';
import tiktok from '@proton/styles/assets/img/brand/tiktok.svg';
import twitch from '@proton/styles/assets/img/brand/twitch.svg';
import uber from '@proton/styles/assets/img/brand/uber.svg';
import ubs from '@proton/styles/assets/img/brand/ubs.svg';
import verizon from '@proton/styles/assets/img/brand/verizon.svg';
import walmart from '@proton/styles/assets/img/brand/walmart.svg';
import wellsFargo from '@proton/styles/assets/img/brand/wells-fargo.svg';
import xbox from '@proton/styles/assets/img/brand/xbox.svg';
import xfinity from '@proton/styles/assets/img/brand/xfinity.svg';
import zuercherKantonalbank from '@proton/styles/assets/img/brand/zuercher-kantonalbank.svg';

export enum OnlineServiceCategory {
    BANKING = 'BANKING',
    CRYPTO = 'CRYPTO',
    ENTERTAINMENT = 'ENTERTAINMENT',
    FOOD_DRINKS = 'FOOD_DRINKS',
    GAMING = 'GAMING',
    SHOPPING = 'SHOPPING',
    SOCIAL_NETWORK = 'SOCIAL_NETWORK',
    TRAVEL = 'TRAVEL',
    UTILITIES = 'UTILITIES',
}

export type OnlineServicesKey =
    | 'apple'
    | 'amazon'
    | 'aliexpress'
    | 'ebay'
    | 'facebook'
    | 'github'
    | 'instagram'
    | 'linkedin'
    | 'tiktok'
    | 'netflix'
    | 'paypal'
    | 'reddit'
    | 'spotify'
    | 'walmart'
    | 'substack'
    | 'american-express'
    | 'bank-of-america'
    | 'capital-one'
    | 'chase'
    | 'credit-karma'
    | 'discover'
    | 'wells-fargo'
    | 'banque-populaire'
    | 'barclays'
    | 'bbva'
    | 'bnp-paribas'
    | 'caixa-bank'
    | 'credit-agricole'
    | 'deutsche-bank'
    | 'dz-bank'
    | 'hsbc'
    | 'kfw'
    | 'lloyds'
    | 'raiffeisen'
    | 'santander'
    | 'ubs'
    | 'zurcher-kantonalbank'
    | 'bestbuy'
    | 'home-depot'
    | 'instacart'
    | 'target'
    | 'disney-plus'
    | 'prime-video'
    | 'twitch'
    | 'dominos'
    | 'doordash'
    | 'mcdonalds'
    | 'uber-eats'
    | 'discord'
    | 'steam'
    | 'nintendo'
    | 'playstation'
    | 'xbox'
    | 'airbnb'
    | 'booking-dot-com'
    | 'expedia'
    | 'hotels-dot-com'
    | 'lyft'
    | 'uber'
    | 'att'
    | 't-mobile'
    | 'verizon'
    | 'xfinity'
    | 'coinbase'
    | 'robinhood'
    | 'binance';

export interface OnlineService {
    key: OnlineServicesKey;
    /** Brand name */
    name: string;
    /** Login URL of the online service */
    url: string;
    /** Brand logo */
    img: string;
    /** For country specific brands */
    country?: CountryTimezoneShortFormat;
    /** Category of the online service */
    category: `${OnlineServiceCategory}`;
    mostPopular?: boolean;
}

export const ONLINE_SERVICES: Record<OnlineServicesKey, OnlineService> = {
    apple: {
        key: 'apple',
        name: 'Apple',
        url: 'https://appleid.apple.com/',
        img: apple,
        mostPopular: true,
        category: 'SHOPPING',
    },
    amazon: {
        key: 'amazon',
        name: 'Amazon',
        url: 'https://www.amazon.com/gp/css/account/info/view.html',
        img: amazon,
        mostPopular: true,
        category: 'SHOPPING',
    },
    aliexpress: {
        key: 'aliexpress',
        name: 'AliExpress',
        url: 'https://aliexpress.com/',
        img: aliexpress,
        category: 'SHOPPING',
    },
    ebay: {
        key: 'ebay',
        name: 'Ebay',
        url: 'https://signin.ebay.com/ws/eBayISAPI.dll?SignIn&ru=https://accountsettings.ebay.com/uas',
        img: ebay,
        mostPopular: true,
        category: 'SHOPPING',
    },
    facebook: {
        key: 'facebook',
        name: 'Facebook',
        url: 'https://accountscenter.facebook.com/personal_info/contact_points',
        img: facebook,
        mostPopular: true,
        category: 'SOCIAL_NETWORK',
    },
    github: {
        key: 'github',
        name: 'Github',
        url: 'https://github.com/login',
        img: github,
        mostPopular: true,
        category: 'SOCIAL_NETWORK',
    },
    instagram: {
        key: 'instagram',
        name: 'Instagram',
        url: 'https://www.instagram.com/accounts/login/',
        img: instagram,
        mostPopular: true,
        category: 'SOCIAL_NETWORK',
    },
    linkedin: {
        key: 'linkedin',
        name: 'Linkedin',
        url: 'https://www.linkedin.com/mypreferences/d/manage-email-addresses',
        img: linkedin,
        mostPopular: true,
        category: 'SOCIAL_NETWORK',
    },
    tiktok: {
        key: 'tiktok',
        name: 'TikTok',
        url: 'https://www.tiktok.com/login',
        img: tiktok,
        mostPopular: false,
        category: 'SOCIAL_NETWORK',
    },
    netflix: {
        key: 'netflix',
        name: 'Netflix',
        url: 'https://www.netflix.com/YourAccount',
        img: netflix,
        mostPopular: true,
        category: 'ENTERTAINMENT',
    },
    paypal: {
        key: 'paypal',
        name: 'Paypal',
        url: 'https://www.paypal.com/myaccount/settings/',
        img: paypal,
        mostPopular: true,
        category: 'UTILITIES',
    },
    reddit: {
        key: 'reddit',
        name: 'Reddit',
        url: 'https://www.reddit.com/login',
        img: reddit,
        mostPopular: true,
        category: 'SOCIAL_NETWORK',
    },
    spotify: {
        key: 'spotify',
        name: 'Spotify',
        url: 'https://www.spotify.com/us/account/overview/',
        img: spotify,
        mostPopular: true,
        category: 'ENTERTAINMENT',
    },
    walmart: {
        key: 'walmart',
        name: 'Walmart',
        url: 'https://www.walmart.com/account/login',
        img: walmart,
        country: 'US',
        mostPopular: true,
        category: 'SHOPPING',
    },
    substack: {
        key: 'substack',
        name: 'Substack',
        url: 'https://substack.com/sign-in',
        img: substack,
        mostPopular: true,
        category: 'UTILITIES',
    },
    'american-express': {
        key: 'american-express',
        name: 'American express',
        url: 'https://www.americanexpress.com/en-us/account/login',
        img: americanExpress,
        country: 'US',
        category: 'BANKING',
    },
    'bank-of-america': {
        key: 'bank-of-america',
        name: 'Bank of America',
        url: 'https://secure.bankofamerica.com/login/sign-in/signOnV2Screen.go',
        img: bankOfAmerica,
        country: 'US',
        category: 'BANKING',
    },
    'capital-one': {
        key: 'capital-one',
        name: 'Capital One',
        url: 'https://verified.capitalone.com/auth/signin',
        img: capitalOne,
        country: 'US',
        category: 'BANKING',
    },
    chase: {
        key: 'chase',
        name: 'Chase',
        url: 'https://www.chase.com/personal/for-you-login',
        img: chase,
        country: 'US',
        category: 'BANKING',
    },
    'credit-karma': {
        key: 'credit-karma',
        name: 'Credit karma',
        url: 'https://www.creditkarma.com/auth/logon',
        img: creditKarma,
        country: 'US',
        category: 'BANKING',
    },
    discover: {
        key: 'discover',
        name: 'Discover',
        url: 'https://portal.discover.com/customersvcs/universalLogin/ac_main',
        img: discover,
        country: 'US',
        category: 'BANKING',
    },
    'wells-fargo': {
        key: 'wells-fargo',
        name: 'Wells Fargo',
        url: 'https://connect.secure.wellsfargo.com/auth/login/present',
        img: wellsFargo,
        country: 'US',
        category: 'BANKING',
    },
    'banque-populaire': {
        key: 'banque-populaire',
        name: 'Banque Populaire',
        url: 'https://www.banquepopulaire.fr',
        img: banquePopulaire,
        country: 'FR',
        category: 'BANKING',
    },
    barclays: {
        key: 'barclays',
        name: 'Barclays',
        url: 'https://bank.barclays.co.uk',
        img: barclays,
        country: 'GB',
        category: 'BANKING',
    },
    bbva: {
        key: 'bbva',
        name: 'BBVA',
        url: 'https://www.bbva.es',
        img: bbva,
        country: 'ES',
        category: 'BANKING',
    },
    'bnp-paribas': {
        key: 'bnp-paribas',
        name: 'BNP Paribas',
        url: 'https://mabanque.bnpparibas',
        img: bnpParibas,
        country: 'FR',
        category: 'BANKING',
    },
    'caixa-bank': {
        key: 'caixa-bank',
        name: 'Caixa Bank',
        url: 'https://www.caixabank.es',
        img: caixaBank,
        country: 'ES',
        category: 'BANKING',
    },
    'credit-agricole': {
        key: 'credit-agricole',
        name: 'Credit Agricole',
        url: 'https://www.credit-agricole.fr/',
        img: creditAgricole,
        country: 'FR',
        category: 'BANKING',
    },
    'deutsche-bank': {
        key: 'deutsche-bank',
        name: 'Deutsche Bank',
        url: 'https://www.deutsche-bank.de',
        img: deutscheBank,
        country: 'DE',
        category: 'BANKING',
    },
    'dz-bank': {
        key: 'dz-bank',
        name: 'DZ Bank',
        url: 'https://www.dzbank.de',
        img: dzBank,
        country: 'DE',
        category: 'BANKING',
    },
    hsbc: {
        key: 'hsbc',
        name: 'HSBC',
        url: 'https://www.hsbc.co.uk',
        img: hsbc,
        country: 'GB',
        category: 'BANKING',
    },
    kfw: {
        key: 'kfw',
        name: 'KFW',
        url: 'https://www.kfw.de',
        img: kfw,
        country: 'DE',
        category: 'BANKING',
    },
    lloyds: {
        key: 'lloyds',
        name: 'Lloyds',
        url: 'https://www.lloydsbank.com',
        img: lloyds,
        country: 'GB',
        category: 'BANKING',
    },
    raiffeisen: {
        key: 'raiffeisen',
        name: 'Raiffeisen',
        url: 'https://www.raiffeisen.ch',
        img: raiffeisen,
        country: 'CH',
        category: 'BANKING',
    },
    santander: {
        key: 'santander',
        name: 'Santander',
        url: 'https://www.santander.co.uk',
        img: santander,
        country: 'GB',
        category: 'BANKING',
    },
    ubs: {
        key: 'ubs',
        name: 'UBS',
        url: 'https://www.ubs.com',
        img: ubs,
        country: 'CH',
        category: 'BANKING',
    },
    'zurcher-kantonalbank': {
        key: 'zurcher-kantonalbank',
        name: 'Zürcher Kantonalbank',
        url: 'https://www.zkb.ch',
        img: zuercherKantonalbank,
        country: 'CH',
        category: 'BANKING',
    },
    bestbuy: {
        key: 'bestbuy',
        name: 'Bestbuy',
        url: 'https://www.bestbuy.com/identity/global/signin',
        img: bestBuy,
        country: 'US',
        category: 'SHOPPING',
    },
    'home-depot': {
        key: 'home-depot',
        name: 'Home Depot',
        url: 'https://www.homedepot.com/auth/view/signin',
        img: homeDepot,
        country: 'US',
        category: 'SHOPPING',
    },
    instacart: {
        key: 'instacart',
        name: 'instacart',
        url: 'https://www.instacart.com/login',
        img: instacart,
        country: 'US',
        category: 'SHOPPING',
    },
    target: {
        key: 'target',
        name: 'Target',
        url: 'https://www.target.com/account',
        img: target,
        country: 'US',
        category: 'SHOPPING',
    },
    'disney-plus': {
        key: 'disney-plus',
        name: 'Disney plus',
        url: 'https://www.disneyplus.com/oauth',
        img: disneyPlus,
        category: 'ENTERTAINMENT',
    },
    'prime-video': {
        key: 'prime-video',
        name: 'Prime Video',
        url: 'https://www.amazon.com/log/s?k=log+in',
        img: primeVideo,
        category: 'ENTERTAINMENT',
    },
    twitch: {
        key: 'twitch',
        name: 'Twitch',
        url: 'https://www.twitch.tv/settings/security',
        img: twitch,
        category: 'ENTERTAINMENT',
    },
    dominos: {
        key: 'dominos',
        name: 'Dominos',
        url: 'https://www.dominos.com/',
        img: dominos,
        country: 'US',
        category: 'FOOD_DRINKS',
    },
    doordash: {
        key: 'doordash',
        name: 'Doordash',
        url: 'https://www.doordash.com/consumer/login/',
        img: doordash,
        country: 'US',
        category: 'FOOD_DRINKS',
    },
    mcdonalds: {
        key: 'mcdonalds',
        name: 'Mcdonalds',
        url: 'https://www.mcdonalds.com/us/en-us/my-account.html',
        img: mcdonalds,
        country: 'US',
        category: 'FOOD_DRINKS',
    },
    'uber-eats': {
        key: 'uber-eats',
        name: 'Uber Eats',
        url: 'http://ubereats.com/login-redirect/',
        img: uber,
        category: 'FOOD_DRINKS',
    },
    discord: {
        key: 'discord',
        name: 'Discord',
        url: 'https://discord.com/',
        img: discord,
        category: 'GAMING',
    },
    steam: {
        key: 'steam',
        name: 'Steam',
        url: 'https://help.steampowered.com/en/login/',
        img: steam,
        category: 'GAMING',
    },
    nintendo: {
        key: 'nintendo',
        name: 'Nintendo',
        url: 'https://accounts.nintendo.com/login?',
        img: nintendo,
        category: 'GAMING',
    },
    playstation: {
        key: 'playstation',
        name: 'Playstation',
        url: 'https://www.playstation.com/en-us/playstation-network/',
        img: playStation,
        category: 'GAMING',
    },
    xbox: {
        key: 'xbox',
        name: 'Xbox',
        url: 'https://www.xbox.com/en-MY/live',
        img: xbox,
        category: 'GAMING',
    },
    airbnb: {
        key: 'airbnb',
        name: 'Airbnb',
        url: 'https://www.airbnb.com/login?redirect_url=/account-settings/personal-info',
        img: airbnb,
        category: 'TRAVEL',
    },
    'booking-dot-com': {
        key: 'booking-dot-com',
        name: 'Booking.com',
        url: 'https://www.booking.com/signin.en.html',
        img: booking,
        category: 'TRAVEL',
    },
    expedia: {
        key: 'expedia',
        name: 'Expedia',
        url: 'https://www.expedia.com/',
        img: expedia,
        category: 'TRAVEL',
    },
    'hotels-dot-com': {
        key: 'hotels-dot-com',
        name: 'Hotels.com',
        url: 'https://www.hotels.com/account?edit=contact-information',
        img: hotels,
        category: 'TRAVEL',
    },
    lyft: {
        key: 'lyft',
        name: 'Lyft',
        url: 'https://account.lyft.com/auth',
        img: lyft,
        country: 'US',
        category: 'TRAVEL',
    },
    uber: {
        key: 'uber',
        name: 'Uber',
        url: 'http://ubereats.com/login-redirect/',
        img: uber,
        category: 'TRAVEL',
    },
    att: {
        key: 'att',
        name: 'ATT',
        url: 'https://www.att.com/my/',
        img: att,
        country: 'US',
        category: 'UTILITIES',
    },
    't-mobile': {
        key: 't-mobile',
        name: 'T-mobile',
        url: 'https://account.t-mobile.com/',
        img: tMobile,
        country: 'US',
        category: 'UTILITIES',
    },
    verizon: {
        key: 'verizon',
        name: 'Verizon',
        url: 'https://secure.verizon.com/signin',
        img: verizon,
        country: 'US',
        category: 'UTILITIES',
    },
    xfinity: {
        key: 'xfinity',
        name: 'Xfinity',
        url: 'https://login.xfinity.com/login',
        img: xfinity,
        country: 'US',
        category: 'UTILITIES',
    },
    coinbase: {
        key: 'coinbase',
        name: 'Coinbase',
        url: 'https://www.coinbase.com/signin',
        img: coinbase,
        category: 'CRYPTO',
    },
    robinhood: {
        key: 'robinhood',
        name: 'Robinhood',
        url: 'https://robinhood.com/login',
        img: robinhood,
        country: 'US',
        category: 'CRYPTO',
    },
    binance: {
        key: 'binance',
        name: 'Binance',
        url: 'https://accounts.binance.com/en/login?loginChannel=faq&return_to=aHR0cHM6Ly93d3cuYmluYW5jZS5jb20vZW4vc3VwcG9ydC9mYXEvaG93LXRvLWNoYW5nZS1hY2NvdW50LWVtYWlsLTExNTAwMzc4NDg3MQ%3D%3D',
        img: binance,
        category: 'CRYPTO',
    },
};
