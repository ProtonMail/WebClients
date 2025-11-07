import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import LayoutLogosV2 from '../public/LayoutLogosV2';

interface Props {
    children?: ReactNode;
    className?: string;
    center?: boolean;
    includeDescription?: boolean;
}

const PublicFooter = ({ children, className, center = true, includeDescription = false }: Props) => {
    return (
        <footer className={clsx('text-sm', className)}>
            <div className="mb-1">
                <LayoutLogosV2 size={5} className={center ? 'justify-center' : undefined} />
            </div>
            <div className={clsx('mb-6 color-weak', center && 'text-center')}>
                {
                    // translator: full sentence 'Proton. Privacy by default.'
                    c('Footer').t`${BRAND_NAME}. Privacy by default.`
                }
            </div>
            {includeDescription && (
                <>
                    <div className="color-weak">
                        {c('Info')
                            .t`${BRAND_NAME} is privacy you can trust, ensured by strong encryption, open-source code, and Swiss privacy laws. We believe nobody should be able to exploit your data, period. Our technology and business are based upon this fundamentally stronger definition of privacy.`}
                    </div>
                    <br />
                    <div className="mb-6 color-weak">
                        {c('Info').t`Over 100 million people and businesses have signed up for ${BRAND_NAME}.`}{' '}
                        <Href className="color-weak" href={getStaticURL('')}>
                            {c('Link').t`Learn more`}
                        </Href>
                    </div>
                </>
            )}
            {children}
        </footer>
    );
};

export default PublicFooter;
