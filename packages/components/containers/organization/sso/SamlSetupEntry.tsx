import type { ReactElement } from 'react';

import { c } from 'ttag';

import { useOrgPermissions } from '@proton/account/userPermissions/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal';
import { IDP_TYPE } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';

import edugain from './idp-logos/edugain.svg';
import google from './idp-logos/google.svg';
import microsoft from './idp-logos/microsoft.svg';
import okta from './idp-logos/okta.svg';

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
        logo: <IcThreeDotsHorizontal size={8} />,
    },
];

const SelectIDPSection = ({ onClick, disabled }: { onClick: (IDPType: IDP_TYPE) => void; disabled: boolean }) => (
    <div>
        <h3 className="text-rg text-semibold mb-2">{c('Label').t`Select an identity provider to start`}</h3>

        <div
            className="grid w-full max-w-custom flex gap-4"
            style={{ '--max-w-custom': '43em', 'grid-template-columns': 'repeat(3, 1fr)' }}
        >
            {idpOptions.map(({ name, translatedName, logo, type }) => (
                <Tooltip key={name} title={disabled ? c('Label').t`You don't have permissions` : null} openDelay={100}>
                    <span className="inline-flex">
                        <Button
                            title={name}
                            shape="outline"
                            color="weak"
                            onClick={() => onClick(type)}
                            className="p-4 w-full"
                            disabled={disabled}
                        >
                            <div className="mb-1">{logo}</div>
                            <span className="text-ellipsis block">{translatedName()}</span>
                        </Button>
                    </span>
                </Tooltip>
            ))}
        </div>
    </div>
);

const SamlSetupEntry = ({ onBeginSamlSetup }: { onBeginSamlSetup: (idpType: IDP_TYPE) => void }) => {
    const isEduGainSSOEnabled = useFlag('EduGainSSO');
    const [permissions] = useOrgPermissions();

    const canCreate = !!permissions?.['account.sso_config.create'];

    if (isEduGainSSOEnabled) {
        return <SelectIDPSection onClick={onBeginSamlSetup} disabled={!canCreate} />;
    }

    return (
        <Button color="norm" onClick={() => onBeginSamlSetup(IDP_TYPE.DEFAULT)} disabled={!canCreate}>
            {c('Action').t`Configure SAML`}
        </Button>
    );
};

export default SamlSetupEntry;
