import type { FC } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { IcLifeRing } from '@proton/icons/icons/IcLifeRing';
import { IcPlay } from '@proton/icons/icons/IcPlay';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { DEFAULT_REGISTRAR, getRegistrarByIANAId } from '../../domains';

const DomainHelp: FC<{ registrarId?: number }> = ({ registrarId }) => {
    const here = <Href href={getKnowledgeBaseUrl('/custom-domain')} key="link-to-kb">{c('Link').t`here`}</Href>;

    const registrar = getRegistrarByIANAId(registrarId) || DEFAULT_REGISTRAR;

    const registrarLink = (
        <Href href={registrar.url || DEFAULT_REGISTRAR.url} key="link-to-registrar">
            <IcPlay className="border border-primary rounded-full text-no-decoration mr-1" />
            <span>{registrar.name}</span>
        </Href>
    );

    return (
        <div className="bg-weak rounded-lg p-6 max-w-custom" style={{ '--max-w-custom': '15rem' }}>
            <h4 className="flex items-center text-semibold gap-2 text-lg">
                <IcLifeRing alt="" className="shrink-0" />
                {c('BOSS').t`Need help?`}
            </h4>
            <ol className="my-2 color-weak text-lg px-0 pl-6">
                <li className="mb-2">{c('BOSS')
                    .jt`Don’t know where to start? Watch how to update your DNS on ${registrarLink}`}</li>
                <li className="mb-2">{c('BOSS').jt`Get help and useful tips for other domain providers ${here}`}</li>
            </ol>
        </div>
    );
};

export default DomainHelp;
