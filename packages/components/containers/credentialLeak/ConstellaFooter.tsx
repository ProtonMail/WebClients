import { c } from 'ttag';

// import constella from '@proton/styles/assets/img/illustrations/constella.svg';
import { Href } from '@proton/atoms/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';

//TODO: IF NOT USING CONSTELLA IMG, DELETE FILE AND CLEAN UP CODE
const ConstellaFooter = () => {
    const constellaAI = (
        <Href key={`link-to-constella-ai`} href={'https://constella.ai'}>{c('Link').t`Constella AI`}</Href>
    );

    return (
        <span className="text-xs color-hint text-center">{c('Info')
            .jt`Breach Alert is powered by ${BRAND_NAME}'s propietary datasets, open source datasets, and datasets from ${constellaAI}`}</span>
        // <div className="flex justify-center gap-1">
        //     <span className="text-sm color-hint">Powered by</span>
        //     <img src={constella} className="block" alt="constella logo" />
        // </div>
    );
};

export default ConstellaFooter;
