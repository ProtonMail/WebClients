import { c } from 'ttag';

import { BRAND_NAME, WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { getBlogURL, getKnowledgeBaseUrl, getStaticURL } from '@proton/shared/lib/helpers/url';
import bitcoinGuideForNewcomers from '@proton/styles/assets/img/wallet/bitcoin-guide-for-newcomers-cover.png';
import protonWalletLaunchCover from '@proton/styles/assets/img/wallet/proton-wallet-launch-cover.png';
import protonWalletLaunchPreview from '@proton/styles/assets/img/wallet/proton-wallet-launch-preview.png';
import protonWalletSecurityModel from '@proton/styles/assets/img/wallet/proton-wallet-security-model-cover.png';
import securingYourWallet from '@proton/styles/assets/img/wallet/securing-your-wallet-blog-cover.png';
import sendingBitcoinViaEmail from '@proton/styles/assets/img/wallet/sending-bitcoin-via-email-blog-cover.png';
import whatIsBitcoin from '@proton/styles/assets/img/wallet/what-is-bitcoin-cover.png';

export const articles = () => {
    return [
        {
            id: 1,
            title: c('Discover').t`Bitcoin guide for newcomers`,
            text: c('Discover')
                .t`We review some important history and features of Bitcoin for newcomers. We also look at how Bitcoin enables financial sovereignty and freedom. Finally, we explore the challenges facing Bitcoin and its future potential.`,
            coverSrc: bitcoinGuideForNewcomers,
            link: getStaticURL('/wallet/bitcoin-guide-for-newcomers'),
        },
        {
            id: 2,
            title: c('Discover').t`What is Bitcoin?`,
            text: c('Discover')
                .t`Bitcoin is an innovative payment network that leverages peer-to-peer transactions to remove the need for a central bank. Bitcoin has revolutionized the core principles of value exchange by showing that a network of fully independent nodes can operate payments in a trustless and secure way.`,
            coverSrc: whatIsBitcoin,
            link: getBlogURL('/what-is-bitcoin'),
        },
        {
            id: 3,
            title: c('Discover').t`${WALLET_APP_NAME} launch`,
            text: c('Discover')
                .t`We explain why ${WALLET_APP_NAME} was created and what benefits it can bring to the ${BRAND_NAME} community.`,
            coverSrc: protonWalletLaunchCover,
            previewSrc: protonWalletLaunchPreview,
            link: getBlogURL('/proton-wallet-launch'),
        },
        {
            id: 4,
            title: c('Discover').t`${WALLET_APP_NAME} security model`,
            text: c('Discover')
                .t`We review the key features and security architecture that make ${WALLET_APP_NAME} a private and secure wallet that is as easy to use as email.`,
            coverSrc: protonWalletSecurityModel,
            link: getBlogURL('/proton-wallet-security-model'),
        },
        {
            id: 5,
            title: c('Discover').t`Bitcoin via Email`,
            text: c('Discover')
                .t`Bitcoin via Email is a unique feature in ${WALLET_APP_NAME} that makes sending bitcoin as easy as sending an email. Any ${WALLET_APP_NAME} user can frictionlessly receive bitcoin with their email.`,
            coverSrc: sendingBitcoinViaEmail,
            link: getKnowledgeBaseUrl('/wallet-bitcoin-via-email'),
        },
        {
            id: 6,
            title: c('Discover').t`How to protect your ${WALLET_APP_NAME}`,
            text: c('Discover')
                .t`We review how to secure your wallets and Bitcoin, including important recovery methods in case you ever forget your password.`,
            coverSrc: securingYourWallet,
            link: getKnowledgeBaseUrl('/wallet-protection'),
        },
    ];
};

export type DiscoverArticle = ReturnType<typeof articles>[0];
