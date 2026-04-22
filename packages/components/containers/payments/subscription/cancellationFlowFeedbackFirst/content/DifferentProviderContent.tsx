import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { B2BStoryCards } from '../components/B2BStoryCards';
import { B2CStoryCards } from '../components/B2CStoryCards';
import { ComparisonTable } from '../components/ComparisonTable';
import {
    B2B_COMPETITORS,
    B2C_COMPETITORS,
    getDifferentProviderB2BConfig,
    getDifferentProviderB2CConfig,
} from '../config/differentProviderConfig';
import type { Competitor } from '../config/differentProviderConfig';
import { useFeedbackFirstEligibility } from '../hooks/useFeedbackFirstEligibility';

interface Props {
    onKeepPlan: () => void;
    onContinueCancelling: () => void;
    feedbackReason?: string;
}

interface CompetitorHeaderProps {
    competitors: Competitor[];
    competitor: Competitor;
    onSelect: (competitor: Competitor) => void;
}

const CompetitorHeader = ({ competitors, competitor, onSelect }: CompetitorHeaderProps) => {
    return (
        <SimpleDropdown
            as={Button}
            shape="ghost"
            size="small"
            className="p-0"
            content={
                <span className="flex items-center justify-center gap-2 flex-wrap">
                    <img src={competitor.logo} alt="" width={20} height={20} />
                    <span className="text-semibold">{competitor.name}</span>
                </span>
            }
        >
            <DropdownMenu>
                {competitors
                    .filter((c) => c.name !== competitor.name)
                    .map((competitorOption: Competitor) => {
                        return (
                            <DropdownMenuButton
                                key={competitorOption.name}
                                className="flex items-center gap-2"
                                onClick={() => {
                                    onSelect(competitorOption);
                                }}
                            >
                                <img src={competitorOption.logo} alt="" width={16} height={16} />
                                <span>{competitorOption.name}</span>
                            </DropdownMenuButton>
                        );
                    })}
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export const DifferentProviderContent = ({ onKeepPlan, onContinueCancelling, feedbackReason }: Props) => {
    const { hasB2CAccess, hasB2BAccess } = useFeedbackFirstEligibility();

    const getInitialCompetitor = () => {
        const competitorsList = hasB2CAccess ? B2C_COMPETITORS : B2B_COMPETITORS;

        if (!feedbackReason) {
            return competitorsList[0];
        }

        return (
            competitorsList.find((competitor) => competitor.name.toLowerCase() === feedbackReason.toLowerCase()) ||
            competitorsList[0]
        );
    };

    const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor>(getInitialCompetitor());
    const B2CConfig = getDifferentProviderB2CConfig();
    const B2BConfig = getDifferentProviderB2BConfig();

    const CompetitorHeaderB2C = (
        <CompetitorHeader
            competitors={B2C_COMPETITORS}
            competitor={selectedCompetitor}
            onSelect={setSelectedCompetitor}
        />
    );
    const CompetitorHeaderB2B = (
        <CompetitorHeader
            competitors={B2B_COMPETITORS}
            competitor={selectedCompetitor}
            onSelect={setSelectedCompetitor}
        />
    );

    return (
        <>
            <ModalTwoHeader title={c('Title').t`How ${MAIL_APP_NAME} is different`} titleClassName="text-4xl" />
            <ModalTwoContent>
                {hasB2CAccess && (
                    <>
                        <p>
                            {c('Subtitle')
                                .t`See how ${MAIL_APP_NAME} compares, and why our independence makes a difference.`}
                        </p>
                        <ComparisonTable
                            leftHeader={B2CConfig.protonHeader}
                            rightHeader={CompetitorHeaderB2C}
                            features={B2CConfig.features}
                        />
                        <p className="mt-12">{c('Info')
                            .t`${BRAND_NAME} is independently funded and operates without advertising. Below are examples of how this independence has been used in practice.`}</p>
                        <B2CStoryCards />
                    </>
                )}
                {hasB2BAccess && (
                    <>
                        <p>{c('Subtitle').t`Compare the key differences that matter for your business.`}</p>
                        <ComparisonTable
                            leftHeader={B2BConfig.protonHeader}
                            rightHeader={CompetitorHeaderB2B}
                            features={B2BConfig.features}
                        />
                        <p className="mt-12">{c('Info')
                            .t`${BRAND_NAME} Business plans gives your team all the collaboration tools they need to be productive and organized in their work, while safeguarding your business.`}</p>
                        <B2BStoryCards />
                    </>
                )}
            </ModalTwoContent>

            <ModalTwoFooter className="flex justify-end gap-2">
                <Button shape="outline" color="weak" onClick={onKeepPlan}>
                    {c('Action').t`Keep current plan`}
                </Button>
                <Button color="danger" onClick={onContinueCancelling}>
                    {c('Action').t`Continue cancelling`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};
