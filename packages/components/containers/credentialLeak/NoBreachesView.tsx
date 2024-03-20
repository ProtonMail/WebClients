import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { Icon, IconName } from '@proton/components/components';
import { BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl, getStaticURL } from '@proton/shared/lib/helpers/url';

import './BreachCard.scss';

interface RecommendedTech {
    tech: string;
    icon: Extract<IconName, 'alias' | 'brand-proton-pass' | 'brand-proton-vpn'>;
    link: string;
    desc: string;
    href: string;
}

const protonTech = (): RecommendedTech[] => [
    {
        tech: 'aliases',
        icon: 'alias',
        link: c('Link').t`Create an alias`,
        desc: c('Info')
            .t`Use aliases to sign up for online services. This protects your real email address and identity, limiting the blast radius of a breach.`,
        href: getKnowledgeBaseUrl('/addresses-and-aliases'),
    },
    {
        tech: 'pass',
        icon: 'brand-proton-pass',
        link: c('Link').t`Get ${BRAND_NAME} Pass`,
        desc: c('Info').t`Use ${BRAND_NAME} Pass to generate strong passwords and avoid password re-use`,
        href: getStaticURL('/pass'),
    },
    {
        tech: 'vpn',
        icon: 'brand-proton-vpn',
        link: c('Link').t`Get ${VPN_APP_NAME}`,
        desc: c('Info').t`Use ${VPN_APP_NAME} with Netshield enabled to protect you from phishing and malware`,
        href: getStaticURL('/vpn'),
    },
];

const NoBreachesView = () => {
    return (
        <div className="flex flex-column items-center gap-3 md:gap-5 rounded-lg border-weak shadow-norm ml-2 p-10 text-center max-h-full">
            <span
                className="block ratio-square rounded flex w-custom breach-icon-bg-success"
                style={{ '--w-custom': '4rem' }}
            >
                <Icon name="checkmark" size={14} className="m-auto block color-success mb-2" />
            </span>
            <h3 className="color-success">{c('Title').t`No account information was found in any data breaches`}</h3>
            <p className="text-md text-bold">{c('Info').t`Ways you can minimize your breach risks`}</p>
            <div className="flex flex-column items-stretch md:flex-row md:flex-nowrap gap-4">
                {protonTech().map((tech) => {
                    return (
                        <div className="flex-auto md:flex-1 p-1 md:p-2" key={`${tech.tech}`}>
                            <Icon name={tech.icon} size={12} className="m-auto block color-primary" />
                            <span className="text-center text-md color-weak mt-4 block">{tech.desc}</span>
                            <ButtonLike as="a" shape="underline" color="norm" href={tech.href} target="_blank">
                                {tech.link}
                            </ButtonLike>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NoBreachesView;
