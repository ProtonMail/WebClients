import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl, getStaticURL } from '@proton/shared/lib/helpers/url';
import alias from '@proton/styles/assets/img/breach-alert/img-alias.svg';
import darkweb from '@proton/styles/assets/img/breach-alert/img-dark-web.svg';
import netShield from '@proton/styles/assets/img/breach-alert/img-net-shield.svg';
import allGood from '@proton/styles/assets/img/breach-alert/img-no-breaches-found.svg';
import pwdManager from '@proton/styles/assets/img/breach-alert/img-password-manager.svg';

interface RecommendedTech {
    tech: string;
    img: string;
    title: string;
    link: string;
    desc: string;
    href: string;
}

const protonTech = (): RecommendedTech[] => [
    {
        tech: 'darkweb',
        img: darkweb,
        title: c('Title').t`What is the dark web?`,
        desc: c('Info')
            .t`The dark web is a hidden part of the internet where stolen personal information, like identities, can be bought and sold.`,
        link: c('Link').t`Learn more`,
        href: getStaticURL('/blog/what-is-dark-web'),
    },
    {
        tech: 'aliases',
        img: alias,
        title: c('Title').t`What is an alias?`,
        link: c('Link').t`Create an alias`,
        desc: c('Info')
            .t`An email alias works like an email address, but reduces spam and keeps your actual email address and identity hidden.`,
        href: getKnowledgeBaseUrl('/addresses-and-aliases'),
    },
    {
        tech: 'vpn',
        img: netShield,
        title: c('Title').t`Block trackers and malware`,
        link: c('Link').t`Get ${VPN_APP_NAME}`,
        desc: c('Info')
            .t`NetShield is an ad-blocking feature from ${VPN_APP_NAME} that protects your device from ads, trackers, and malware.`,
        href: getStaticURL('/vpn'),
    },
    {
        tech: 'pass',
        img: pwdManager,
        title: c('Title').t`Passwords made easy`,
        link: c('Link').t`Get ${BRAND_NAME} Pass`,
        desc: c('Info')
            .t`Use a password manager to generate and securely store your passwords, ensuring strong passwords and easier sign-ins.`,
        href: getStaticURL('/pass'),
    },
];

const NoBreachesView = () => {
    return (
        <>
            <div className="flex flex-column flex-nowrap mb-8">
                <img src={allGood} alt="" className="m-auto" />
                <h3 className="color-success text-center m-auto text-rg text-semibold">{c('Title')
                    .t`No account information was found in any data breaches`}</h3>
            </div>
            <div>
                <h4 className="text-xl text-bold">{c('Info').t`Want to learn more?`}</h4>
                <p className="mt-4">{c('Info')
                    .t`Keep your info more secure and private with these guides and tips.`}</p>
                <div className="flex flex-column items-stretch md:flex-row lg:flex-nowrap gap-4">
                    {protonTech().map((tech) => {
                        return (
                            <div
                                className="flex flex-column flex-nowrap flex-auto md:w-1/3 lg:w-auto p-4 border border-weak rounded"
                                key={`${tech.tech}`}
                            >
                                <img src={tech.img} className="m-auto block" alt="" />
                                <h5
                                    className="mt-4 text-rg text-semibold md:min-h-custom"
                                    style={{ '--md-min-h-custom': '2em' }}
                                >
                                    {tech.title}
                                </h5>
                                <p className="text-sm color-weak mt-4 mb-2 flex-auto">{tech.desc}</p>
                                <ButtonLike
                                    className="mt-auto mr-auto text-left"
                                    as="a"
                                    shape="underline"
                                    color="norm"
                                    href={tech.href}
                                    target="_blank"
                                >
                                    {tech.link}
                                </ButtonLike>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default NoBreachesView;
