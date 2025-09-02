import type { ReactElement } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { IDP_TYPE } from '@proton/shared/lib/interfaces';

import edugain from '../idp-logos/edugain.svg';
import google from '../idp-logos/google.svg';
import microsoft from '../idp-logos/microsoft.svg';
import okta from '../idp-logos/okta.svg';

enum IDP_NAME {
    MICROSOFT = 'Microsoft Entra ID',
    GOOGLE = 'Google Cloud Identity Platform',
    OKTA = 'Okta',
    EDUGAIN = 'eduGAIN',
    OTHER = 'Other',
}

interface IDPOptions {
    name: IDP_NAME;
    translatedName: () => string;
    type: IDP_TYPE;
    logo: string | ReactElement;
}

const idpOptions: readonly IDPOptions[] = [
    {
        name: IDP_NAME.MICROSOFT,
        translatedName: () => IDP_NAME.MICROSOFT,
        type: IDP_TYPE.DEFAULT,
        logo: <img src={microsoft} alt="" />,
    },
    {
        name: IDP_NAME.GOOGLE,
        translatedName: () => IDP_NAME.GOOGLE,
        type: IDP_TYPE.DEFAULT,
        logo: <img src={google} alt="" />,
    },
    {
        name: IDP_NAME.OKTA,
        translatedName: () => IDP_NAME.OKTA,
        type: IDP_TYPE.DEFAULT,
        logo: <img src={okta} alt="" />,
    },
    {
        name: IDP_NAME.EDUGAIN,
        translatedName: () => IDP_NAME.EDUGAIN,
        type: IDP_TYPE.EDUGAIN,
        logo: <img src={edugain} alt="" />,
    },
    {
        name: IDP_NAME.OTHER,
        translatedName: () => c('Label').t`Other`,
        type: IDP_TYPE.DEFAULT,
        logo: <Icon name="three-dots-horizontal" size={8} />,
    },
];

const SelectIDPSection = ({ onClick }: { onClick: (IDPType: IDP_TYPE) => void }) => {
    return (
        <div>
            <h3 className="text-rg text-semibold mb-2">{c('Lable').t`Select an identity provider to start`}</h3>

            <div
                className="grid w-full max-w-custom flex gap-4"
                style={{ '--max-w-custom': '43em', 'grid-template-columns': 'repeat(3, 1fr)' }}
            >
                {idpOptions.map(({ name, translatedName, logo, type }) => (
                    <Button
                        key={name}
                        title={name}
                        shape="outline"
                        color="weak"
                        onClick={() => onClick(type)}
                        className="p-4"
                    >
                        <div className="mb-1">{logo}</div>
                        <span className="text-ellipsis block">{translatedName()}</span>
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default SelectIDPSection;
