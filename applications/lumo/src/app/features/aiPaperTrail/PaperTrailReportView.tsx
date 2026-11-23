import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Info from '@proton/components/components/link/Info';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import {
    BRAND_NAME,
    DRIVE_APP_NAME,
    LUMO_SHORT_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import ctaContainerBg from '@proton/styles/assets/img/lumo/trail/cta-container-bg.png';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { PaperTrailLogo } from './PaperTrailLogo';
import { getPaperTrailSectionIcon } from './getPaperTrailSectionIcon';
import { type PaperTrailCardData, type PaperTrailReport, deriveCardData, resolveProfileHandle } from './reportTypes';
import { ShareCardCanvasPreview } from './shareCard/ShareCardCanvasPreview';
import { ShareableCard } from './shareCard/ShareableCard';

import './PaperTrailReportView.scss';

interface Props {
    report: PaperTrailReport;
    onStartOver: () => void;
    onTryLumo: () => void;
}

const formatUsd = (value: number): string => {
    if (!value || value <= 0) {
        return '$0';
    }
    if (value >= 1000) {
        return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
    }
    return `$${Math.round(value)}`;
};

const exposureModifier = (score: number): string => {
    if (score >= 70) {
        return 'pt-score__bar-fill--bad';
    }
    if (score >= 40) {
        return 'pt-score__bar-fill--mid';
    }
    return 'pt-score__bar-fill--good';
};

const exposureTone = (score: number): string => {
    if (score >= 70) {
        return 'pt-tone--bad';
    }
    if (score >= 40) {
        return 'pt-tone--mid';
    }
    return 'pt-tone--good';
};

const exposureLabel = (score: number): string => {
    if (score >= 70) {
        return c('collider_2025:Label').t`High`;
    }
    if (score >= 40) {
        return c('collider_2025:Label').t`Medium`;
    }
    if (score >= 15) {
        return c('collider_2025:Label').t`Low`;
    }
    return c('collider_2025:Label').t`Minimal`;
};

const formatRiskSeverity = (severity: PaperTrailReport['complianceRisks'][number]['severity']): string => {
    if (severity === 'high') {
        return c('collider_2025:Label').t`High`;
    }
    if (severity === 'medium') {
        return c('collider_2025:Label').t`Medium`;
    }
    return c('collider_2025:Label').t`Low`;
};

const ShareRail = ({ cardData, onShare }: { cardData: PaperTrailCardData; onShare: () => void }) => (
    <aside className="pt-share-rail" aria-label={c('collider_2025:Title').t`Share your score`}>
        <div className="pt-share-rail__float gap-4 px-4 py-5 radius-16">
            <h2 className="pt-share-rail__title m-0">{c('collider_2025:Title').t`Share your score`}</h2>
            <ShareCardCanvasPreview data={cardData} theme="light" className="pt-share-rail__canvas" />
            <p className="pt-share-rail__hint m-0 lumo-body-small">
                {c('collider_2025:Info').t`Exposure by life area only, no personal details.`}
            </p>
            <Button color="norm" size="medium" pill fullWidth onClick={onShare}>
                <LumoIcon name="Share" className="mr-2" />
                {c('collider_2025:Action').t`Create shareable card`}
            </Button>
        </div>
    </aside>
);

const ShareMobileBar = ({ onShare }: { onShare: () => void }) => (
    <div className="pt-share-bar">
        <Button color="norm" size="large" pill fullWidth onClick={onShare}>
            <LumoIcon name="Share" className="mr-2" />
            {c('collider_2025:Action').t`Share your score`}
        </Button>
    </div>
);

export const PaperTrailReportView = ({ report, onStartOver, onTryLumo }: Props) => {
    const shareModal = useModalStateObject();
    const redFlagsModal = useModalStateObject();
    const cardData = deriveCardData(report);
    const hasRedFlags = report.sensitiveCategories.length > 0;

    const displayName = report.name || report.label;
    const handle = resolveProfileHandle(report.handle, report.label);

    const aiTerms = [
        {
            title: c('collider_2025:Title').t`Share only what is needed`,
            detail: c('collider_2025:Info')
                .t`Avoid including names, addresses, financial details, or other identifying information when they are not essential.`,
        },
        {
            title: c('collider_2025:Title').t`Review privacy settings`,
            detail: c('collider_2025:Info').t`Turn off chat history and model training where possible.`,
        },
        {
            title: c('collider_2025:Title').t`Delete your data regularly`,
            detail: c('collider_2025:Info').t`Check what your AIs store about you and delete what you no longer need.`,
        },
        {
            title: c('collider_2025:Title').t`Choose privacy-first AI`,
            detail: c('collider_2025:Info')
                .t`${LUMO_SHORT_APP_NAME} is end-to-end encrypted and never used for training, profiling, or advertising.`,
        },
    ];

    return (
        <div className="pt-report gap-5 mx-auto px-6 pt-4">
            <header className="pt-report__hero pt-2 pb-1">
                <h1 className="pt-report__title m-0">{c('collider_2025:Title').t`Meet your AI Paper Trail`}</h1>
                <p className="pt-report__subtitle mx-auto mb-0 lumo-body-large">
                    {c('collider_2025:Info')
                        .t`Every conversation leaves behind small clues. On their own, they don't say much. Together, they can reveal a surprisingly detailed picture of your life. This report shows what other AI providers can infer from your chats. But unlike them, ${LUMO_SHORT_APP_NAME} doesn't see your data.`}
                </p>
            </header>

            <div className="pt-report__layout">
                <div className="pt-report__main">
                    <section className="pt-card pt-card--profile gap-5 radius-16">
                        <div className="pt-profile__head gap-4">
                            <div>
                                <h2 className="pt-profile__name m-0">{displayName}</h2>
                                {report.name && (
                                    <p className="pt-profile__label mb-0 lumo-title-medium">{report.label}</p>
                                )}
                                <p className="pt-profile__handle mt-1 mb-0 lumo-body-large">@{handle}</p>
                            </div>
                            {report.summary && (
                                <p className="pt-profile__summary m-0 py-4 radius-12 lumo-body-large">
                                    {report.summary}
                                </p>
                            )}
                        </div>

                        {report.quickFacts.length > 0 && (
                            <dl className="pt-facts gap-x-5 m-0 radius-12">
                                {report.quickFacts.map((fact, i) => (
                                    <div key={i} className="pt-facts__item">
                                        <dt className="pt-facts__label m-0">{fact.label}</dt>
                                        <dd className="pt-facts__value m-0 lumo-title-medium">{fact.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}

                        <div className="pt-profile__stats gap-3">
                            <div className="pt-stat">
                                <span className="pt-stat__value">{report.dataPointCount || 0}</span>
                                <span className="pt-stat__label lumo-body-small">{c('collider_2025:Info')
                                    .t`data points`}</span>
                            </div>
                            <div className="pt-stat pt-stat--ad-value">
                                <span className="pt-stat__value">{formatUsd(report.estimatedValueUsd)}</span>
                                <span className="pt-stat__label lumo-body-small">
                                    {c('collider_2025:Info').t`ad value`}
                                    {report.valueRationale && (
                                        <Info
                                            title={report.valueRationale}
                                            colorPrimary={false}
                                            openDelay={80}
                                            className="pt-stat__info"
                                            originalPlacement="right"
                                        />
                                    )}
                                </span>
                            </div>
                            {hasRedFlags ? (
                                <button
                                    type="button"
                                    className="pt-stat pt-stat--action pt-stat--alert px-2"
                                    onClick={() => redFlagsModal.openModal(true)}
                                >
                                    <span className="pt-stat__value">{report.sensitiveCategories.length}</span>
                                    <span className="pt-stat__label lumo-body-small">{c('collider_2025:Info')
                                        .t`red flags`}</span>
                                </button>
                            ) : (
                                <div className="pt-stat">
                                    <span className="pt-stat__value">{report.sensitiveCategories.length}</span>
                                    <span className="pt-stat__label lumo-body-small">{c('collider_2025:Info')
                                        .t`red flags`}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {report.dataExposure.length > 0 && (
                        <section className="pt-card pt-card--glance pb-7 radius-16">
                            <h2 className="pt-section-title m-0">{c('collider_2025:Title').t`Report at a glance`}</h2>
                            <p className="pt-section-sub mb-0 lumo-body-large">
                                {c('collider_2025:Info')
                                    .t`The fuller the bar, the more of that area Big Tech could reconstruct. Lower is better.`}
                            </p>
                            <div className="pt-glance mt-4">
                                <div className="pt-glance__scorecard">
                                    <div className="pt-glance__overall gap-x-2 mb-3">
                                        <span className={`pt-glance__score ${exposureTone(cardData.exposureScore)}`}>
                                            {cardData.exposureScore}
                                        </span>
                                        <span className="pt-glance__score-max">/100</span>
                                    </div>
                                    <div className="pt-glance__privacy-type mb-4 px-4 radius-12">
                                        <span className="pt-glance__privacy-type-label">
                                            {c('collider_2025:Label').t`My privacy type`}
                                        </span>
                                        <span
                                            className={`pt-glance__privacy-type-value ${exposureTone(cardData.exposureScore)}`}
                                        >
                                            {cardData.grade}
                                        </span>
                                    </div>
                                    <ul className="pt-score__list m-0 p-0">
                                        {report.dataExposure.map((exposure, i) => {
                                            const exposureScore = Math.max(0, Math.min(100, exposure.score));
                                            const row = (
                                                <span className="pt-score__row-inner">
                                                    <span className="pt-score__area gap-1 lumo-title-small">
                                                        {exposure.area}
                                                        {exposure.detail && (
                                                            <LumoIcon
                                                                name="Info"
                                                                width={14}
                                                                height={14}
                                                                className="pt-score__info"
                                                            />
                                                        )}
                                                    </span>
                                                    <span className="pt-score__bar radius-full">
                                                        <span
                                                            className={`pt-score__bar-fill ${exposureModifier(exposureScore)}`}
                                                            style={{ inlineSize: `${exposureScore}%` }}
                                                        />
                                                    </span>
                                                    <span className={`pt-score__value ${exposureTone(exposureScore)}`}>
                                                        {exposureLabel(exposureScore)}
                                                    </span>
                                                </span>
                                            );
                                            return (
                                                <li key={i} className="pt-score__row radius-8">
                                                    {exposure.detail ? (
                                                        <Tooltip title={exposure.detail} openDelay={80}>
                                                            {row}
                                                        </Tooltip>
                                                    ) : (
                                                        row
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                                <div className="pt-glance__narrative">
                                    {report.revealingDataPoints.length > 0 && (
                                        <>
                                            <h3 className="pt-glance__list-title mt-4">
                                                {c('collider_2025:Title').t`Most revealing`}
                                            </h3>
                                            <ul className="pt-glance__highlights m-0">
                                                {report.revealingDataPoints.map((point, i) => (
                                                    <li key={i}>{point}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {report.sections.length > 0 && (
                        <section className="pt-card radius-16">
                            <h2 className="pt-section-title m-0">{c('collider_2025:Title').t`What we identified`}</h2>
                            <p className="pt-section-sub mb-0 lumo-body-large">
                                {c('collider_2025:Info')
                                    .t`Inferences drawn only from your prompts — grouped by life area.`}
                            </p>
                            <div className="pt-identified-groups mt-5">
                                {report.sections.map((section, sectionIndex) => (
                                    <section
                                        key={`${section.title}-${sectionIndex}`}
                                        className="pt-identified-group"
                                        aria-labelledby={`pt-identified-${sectionIndex}`}
                                    >
                                        <div className="pt-identified-group__head">
                                            <span className="pt-identified-group__icon" aria-hidden="true">
                                                <LumoIcon name={getPaperTrailSectionIcon(section.title)} size={18} />
                                            </span>
                                            <h3
                                                id={`pt-identified-${sectionIndex}`}
                                                className="pt-identified-group__title m-0"
                                            >
                                                {section.title}
                                            </h3>
                                        </div>
                                        <ul className="pt-identified gap-3 m-0 p-0">
                                            {section.findings.map((finding, findingIndex) => (
                                                <li key={findingIndex} className="pt-identified__item p-4">
                                                    <div className="pt-identified__body">
                                                        {finding.label && (
                                                            <span className="pt-identified__category mb-1">
                                                                {finding.label}
                                                            </span>
                                                        )}
                                                        <p className="pt-identified__detail m-0 lumo-body-medium">
                                                            {finding.detail}
                                                        </p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                ))}
                            </div>
                        </section>
                    )}

                    {report.complianceRisks.length > 0 && (
                        <section className="pt-panel pt-panel--compliance p-6 radius-16">
                            <h2 className="pt-section-title m-0">{c('collider_2025:Title')
                                .t`Oversharing blind spots`}</h2>
                            <p className="pt-section-sub mb-0 lumo-body-large">
                                {c('collider_2025:Info')
                                    .t`Some of what you pasted may cross workplace, legal, or data-protection lines. This is here to help you spot it, not to judge.`}
                            </p>
                            <ul className="pt-risks gap-4 mx-0 mt-5 mb-0 p-0">
                                {report.complianceRisks.map((risk, i) => (
                                    <li key={i} className="pt-risk gap-3 p-5 radius-16">
                                        <span
                                            className={`pt-risk__severity pt-risk__severity--${risk.severity} lumo-label-small`}
                                        >
                                            {formatRiskSeverity(risk.severity)}
                                        </span>
                                        <h3 className="pt-risk__title m-0">{risk.category}</h3>
                                        <p className="pt-risk__detail m-0 lumo-body-large">{risk.detail}</p>
                                        {risk.guidance && (
                                            <div className="pt-risk__tip px-4 radius-12">
                                                <div className="pt-risk__tip-head">
                                                    <LumoIcon name="Sparkles" size={14} className="pt-risk__tip-icon" />
                                                    <span className="pt-risk__tip-label">{c('collider_2025:Label')
                                                        .t`Tips`}</span>
                                                </div>
                                                <p className="pt-risk__tip-text m-0 lumo-body-medium">
                                                    {risk.guidance}
                                                </p>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="pt-panel pt-panel--terms p-6 radius-16">
                        <h2 className="pt-section-title m-0">{c('collider_2025:Title').t`Use AI on your terms`}</h2>
                        <ul className="pt-terms mx-0 mt-5 mb-0 p-0">
                            {aiTerms.map((item, i) => (
                                <li key={i} className="pt-terms__item">
                                    <h3 className="pt-terms__title m-0">{item.title}</h3>
                                    <p className="pt-terms__detail m-0 lumo-body-large">{item.detail}</p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <div className="pt-report__actions">
                        <Button shape="solid" size="large" pill onClick={onStartOver}>
                            {c('collider_2025:Action').t`Analyze another export`}
                        </Button>
                    </div>

                    <div
                        className="pt-report__cta-banner gap-4 px-8 py-10"
                        style={{ backgroundImage: `url(${ctaContainerBg})` }}
                    >
                        <PaperTrailLogo className="pt-report__cta-wordmark" />
                        <p className="pt-report__cta-title m-0">
                            {c('collider_2025:Title').t`You saw the profile? Now protect the person behind it.`}
                        </p>
                        <Button color="norm" size="large" pill onClick={onTryLumo}>
                            {c('collider_2025:Action').t`Try ${LUMO_SHORT_APP_NAME} for free`}
                        </Button>
                    </div>

                    <p className="pt-report__footer m-0 lumo-body-small">
                        {c('collider_2025:Info')
                            .t`Built by ${BRAND_NAME}, the privacy brand trusted by over 100 million people and the team behind ${MAIL_APP_NAME}, ${VPN_APP_NAME}, ${DRIVE_APP_NAME}, and ${PASS_APP_NAME}.`}
                    </p>
                </div>

                <ShareRail cardData={cardData} onShare={() => shareModal.openModal(true)} />
            </div>

            <ShareMobileBar onShare={() => shareModal.openModal(true)} />

            {shareModal.render && <ShareableCard data={cardData} {...shareModal.modalProps} />}

            {redFlagsModal.render && (
                <ModalTwo {...redFlagsModal.modalProps} size="medium">
                    <ModalTwoHeader title={c('collider_2025:Title').t`What this profile exposes`} />
                    <ModalTwoContent className="pt-flag-modal">
                        <div className="pt-flag-modal__hero mb-6">
                            <div className="pt-flag-modal__badge mx-auto" aria-hidden="true">
                                <LumoIcon name="ShieldExclamationPoint" size={28} />
                            </div>
                            <p className="pt-flag-modal__count mx-0 mt-0 mb-2">
                                {c('collider_2025:Info').t`${report.sensitiveCategories.length} sensitive categories`}
                            </p>
                            <p className="pt-flag-modal__intro mx-auto my-0 lumo-body-large">
                                {c('collider_2025:Info')
                                    .t`These are the most sensitive categories Big Tech AI could infer about you from your chats — even when you never typed them out explicitly.`}
                            </p>
                        </div>
                        <ul className="pt-flag-modal__list m-0 p-0">
                            {report.sensitiveCategories.map((category, i) => (
                                <li key={i} className="pt-flag-modal__item gap-3 px-4">
                                    <LumoIcon
                                        name="CircleExclamationPoint"
                                        size={18}
                                        className="pt-flag-modal__item-icon"
                                    />
                                    <span className="pt-flag-modal__item-text lumo-label-large">{category}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="pt-flag-modal__footnote mx-0 mt-5 mb-0 px-4 radius-12 lumo-body-medium">
                            {c('collider_2025:Info')
                                .t`This is why it matters: once inferred, these details can power targeting, profiling, and decisions about you — often without transparency or consent.`}
                        </p>
                    </ModalTwoContent>
                </ModalTwo>
            )}
        </div>
    );
};
