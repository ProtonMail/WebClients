import { type FC, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/src';
import { Checkbox, Icon, Label } from '@proton/components/index';
import { RECOVERY_KIT_FILE_NAME } from '@proton/shared/lib/constants';

import recoveryKitPDFImage from '../assets/images/recovery_kit_pdf.svg';
import { Layout } from '../components/layout/Layout';
import { Step, useFlow } from '../contexts/FlowContext';
import { RecoveryKitAside } from './RecoveryKitAside';

export const RecoveryKitStep: FC = () => {
    const [checked, setChecked] = useState(false);
    const { setStep } = useFlow();

    const handleDownload = () => {
        // TODO: Check how to download the file
    };

    const boldRecoveryKitText = <span key="recory-kit-span" className="text-bold">{c('Label').t`Recovery Kit`}</span>;

    return (
        <Layout aside={<RecoveryKitAside />}>
            <h1 className="text-5xl text-bold text-center">{c('Title').t`Save your Recovery Kit`}</h1>
            <div className="mt-10">{c('Subtitle')
                .jt`Your ${boldRecoveryKitText} lets you restore your Proton Account if you’re locked out.`}</div>
            <div className="w-full mt-2">{c('Subtitle')
                .t`It’s the only way to recover everything—store it safely.`}</div>
            <div className="mt-10 rounded-lg pass-signup-promotion-bg w-full">
                <div className="flex items-center justify-space-between">
                    <div className="flex items-center gap-4">
                        <img src={recoveryKitPDFImage} alt="Icon PDF" />
                        <div>
                            <h4 className="text-lg">{c('Title').t`Download PDF`}</h4>
                            <div className="color-weak">{RECOVERY_KIT_FILE_NAME}</div>
                            <div className="color-weak">78 KB</div>
                        </div>
                    </div>
                    <Button
                        className="mr-8 rounded-full pass-signup-button-border"
                        onClick={handleDownload}
                        color="weak"
                        shape="ghost"
                        icon
                        pill
                    >
                        <Icon name="arrow-down-line" size={6} alt={c('Title').t`Download PDF`} />
                    </Button>
                </div>
            </div>
            <div className="flex items-start mt-10 w-full">
                <Checkbox
                    id="understood-recovery-necessity"
                    className="mt-2 mr-2"
                    checked={checked}
                    onChange={() => setChecked((prevState) => !prevState)}
                />
                <Label htmlFor="understood-recovery-necessity" className="flex-1">
                    {c('Label')
                        .t`I understand that if I lose my recovery phrase, I may permanently lose access to my account.`}
                </Label>
            </div>
            <Button
                disabled={!checked}
                size="large"
                color="norm"
                fullWidth
                pill
                className="mt-10 py-4 text-semibold"
                onClick={() => setStep(Step.UpgradePlan)}
            >
                {c('Action').t`Next`}
            </Button>
        </Layout>
    );
};
