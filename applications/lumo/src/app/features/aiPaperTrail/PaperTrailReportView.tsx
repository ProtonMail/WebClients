import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { ModalTwo, ModalTwoContent, ModalTwoHeader, useModalStateObject } from '@proton/components';
import {
    BRAND_NAME,
    DRIVE_APP_NAME,
    LUMO_SHORT_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import lumoLogoWordmark from '@proton/styles/assets/img/lumo/lumo-logo-wordmark.svg';
import ctaContainerBg from '@proton/styles/assets/img/lumo/trail/cta-container-bg.png';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { getPaperTrailSectionIcon } from './getPaperTrailSectionIcon';
import { type PaperTrailCardData, type PaperTrailReport, deriveCardData, toHandle } from './reportTypes';
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

const SharePreview = ({ cardData, onShare }: { cardData: PaperTrailCardData; onShare: () => void }) => (
    <div className="pt-share">
        <h2 className="pt-section-title">{c('collider_2025:Title').t`Share your score`}</h2>
        <p className="pt-section-sub">
            {c('collider_2025:Info')
                .t`Your card shows exposure by life area only — no personal details.`}
        </p>
        <div className="pt-share__body">
            <div className="pt-share__preview" aria-hidden="true">
                <div className="pt-share__preview-head">
                    <span className="pt-share__preview-brand">{LUMO_SHORT_APP_NAME}</span>
                    <span className="pt-share__preview-title">{c('collider_2025:Title').t`AI Paper Trail`}</span>
                </div>
                <div className={`pt-share__preview-score ${exposureTone(cardData.exposureScore)}`}>
                    <span className="pt-share__preview-value">{cardData.exposureScore}</span>
                    <span className="pt-share__preview-grade">{cardData.grade}</span>
                </div>
                <ul className="pt-share__preview-bars">
                    {cardData.areas.slice(0, 5).map((area) => (
                        <li key={area.area} className="pt-share__preview-bar">
                            <span className="pt-share__preview-area">{area.area}</span>
                            <span className="pt-score__bar">
                                <span
                                    className={`pt-score__bar-fill ${exposureModifier(area.exposureScore)}`}
                                    style={{ inlineSize: `${area.exposureScore}%` }}
                                />
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="pt-share__actions">
                <Button color="norm" size="large" pill onClick={onShare}>
                    <LumoIcon name="Share" className="mr-2" />
                    {c('collider_2025:Action').t`Create shareable card`}
                </Button>
            </div>
        </div>
    </div>
);

export const PaperTrailReportView = ({ report, onStartOver, onTryLumo }: Props) => {
    const shareModal = useModalStateObject();
    const redFlagsModal = useModalStateObject();
    const cardData = deriveCardData(report);
    const hasRedFlags = report.sensitiveCategories.length > 0;

    const displayName = report.name || report.label;
    const handle = toHandle(report.name || report.label);

    const risks = [
        {
            emoji: '🎯',
            title: c('collider_2025:Title').t`Targeted manipulation`,
            detail: c('collider_2025:Info')
                .t`A profile like this powers ads and messaging engineered to push your buttons — products, opinions, even how you vote.`,
        },
        {
            emoji: '💸',
            title: c('collider_2025:Title').t`Personalised pricing`,
            detail: c('collider_2025:Info')
                .t`Companies quietly adjust prices and offers based on what they think you can afford.`,
        },
        {
            emoji: '🛒',
            title: c('collider_2025:Title').t`Sold to data brokers`,
            detail: c('collider_2025:Info')
                .t`Inferred traits get bundled and sold to brokers, advertisers, and anyone willing to pay.`,
        },
        {
            emoji: '🎣',
            title: c('collider_2025:Title').t`More convincing scams`,
            detail: c('collider_2025:Info')
                .t`The more that's known about you, the more believable phishing and fraud attempts become.`,
        },
        {
            emoji: '📋',
            title: c('collider_2025:Title').t`Decisions made about you`,
            detail: c('collider_2025:Info')
                .t`Profiles can feed into insurance, lending, and hiring outcomes — without you ever knowing.`,
        },
        {
            emoji: '🏛️',
            title: c('collider_2025:Title').t`Out of your control`,
            detail: c('collider_2025:Info')
                .t`Once collected, your data can be breached, handed over on request, or kept indefinitely.`,
        },
    ];

    const tips = [
        {
            emoji: '🔒',
            title: c('collider_2025:Title').t`Use privacy-first tools`,
            detail: c('collider_2025:Info')
                .t`Pick services that don't train on or sell your conversations — like ${LUMO_SHORT_APP_NAME}, which can't read your chats.`,
        },
        {
            emoji: '🙈',
            title: c('collider_2025:Title').t`Share less with AI`,
            detail: c('collider_2025:Info')
                .t`Keep names, addresses, health details, and financial specifics out of your prompts.`,
        },
        {
            emoji: '🧹',
            title: c('collider_2025:Title').t`Turn off history & training`,
            detail: c('collider_2025:Info')
                .t`In ChatGPT and Claude, disable chat history and model training wherever the setting exists.`,
        },
        {
            emoji: '📧',
            title: c('collider_2025:Title').t`Mask your identity`,
            detail: c('collider_2025:Info')
                .t`Use email aliases and hide-my-email so your real address isn't tied to every account.`,
        },
        {
            emoji: '🗑️',
            title: c('collider_2025:Title').t`Export & delete regularly`,
            detail: c('collider_2025:Info')
                .t`Periodically review, download, and delete the data AI services hold on you.`,
        },
        {
            emoji: '🛡️',
            title: c('collider_2025:Title').t`Prefer end-to-end encryption`,
            detail: c('collider_2025:Info')
                .t`Choose apps where the provider can't read your content in the first place.`,
        },
    ];

    return (
        <div className="pt-report">
            <header className="pt-report__hero">
                <h1 className="pt-report__title">{c('collider_2025:Title').t`Meet your AI Paper Trail`}</h1>
                <p className="pt-report__subtitle">
                    {c('collider_2025:Info')
                        .t`Every conversation leaves behind small clues. On their own, they don't say much. Together, they can reveal a surprisingly detailed picture of your life. This report shows what other AI providers can infer from your chats. But unlike them, ${LUMO_SHORT_APP_NAME} doesn't see your data.`}
                </p>
            </header>

            <section className="pt-card pt-card--profile">
                <div className="pt-profile__head">
                    <div>
                        <h2 className="pt-profile__name">{displayName}</h2>
                        {report.name && <p className="pt-profile__label">{report.label}</p>}
                        <p className="pt-profile__handle">@{handle}</p>
                    </div>
                    {report.summary && <p className="pt-profile__summary">{report.summary}</p>}
                </div>

                {report.quickFacts.length > 0 && (
                    <dl className="pt-facts">
                        {report.quickFacts.map((fact, i) => (
                            <div key={i} className="pt-facts__item">
                                <dt className="pt-facts__label">{fact.label}</dt>
                                <dd className="pt-facts__value">{fact.value}</dd>
                            </div>
                        ))}
                    </dl>
                )}

                <div className="pt-profile__stats">
                    <div className="pt-stat">
                        <span className="pt-stat__value">{report.dataPointCount || 0}</span>
                        <span className="pt-stat__label">{c('collider_2025:Info').t`data points`}</span>
                    </div>
                    <div className="pt-stat">
                        <span className="pt-stat__value">{formatUsd(report.estimatedValueUsd)}</span>
                        <span className="pt-stat__label">{c('collider_2025:Info').t`ad value`}</span>
                    </div>
                    {hasRedFlags ? (
                        <button
                            type="button"
                            className="pt-stat pt-stat--action"
                            onClick={() => redFlagsModal.openModal(true)}
                        >
                            <span className="pt-stat__value">{report.sensitiveCategories.length}</span>
                            <span className="pt-stat__label">{c('collider_2025:Info').t`red flags`}</span>
                        </button>
                    ) : (
                        <div className="pt-stat">
                            <span className="pt-stat__value">{report.sensitiveCategories.length}</span>
                            <span className="pt-stat__label">{c('collider_2025:Info').t`red flags`}</span>
                        </div>
                    )}
                </div>
            </section>

            {report.dataExposure.length > 0 && (
                <section className="pt-card pt-card--glance">
                    <h2 className="pt-section-title">{c('collider_2025:Title').t`Report at a glance`}</h2>
                    <p className="pt-section-sub">
                        {c('collider_2025:Info')
                            .t`The fuller the bar, the more of that area Big Tech could reconstruct. Lower is better.`}
                    </p>
                    <div className="pt-glance">
                        <div className="pt-glance__scorecard">
                            <div className="pt-glance__overall">
                                <span className={`pt-glance__score ${exposureTone(cardData.exposureScore)}`}>
                                    {cardData.exposureScore}
                                </span>
                                <span className="pt-glance__score-max">/100</span>
                                <span className="pt-glance__grade">{cardData.grade}</span>
                            </div>
                            <ul className="pt-score__list">
                                {report.dataExposure.map((exposure, i) => {
                                    const exposureScore = Math.max(0, Math.min(100, exposure.score));
                                    const row = (
                                        <span className="pt-score__row-inner">
                                            <span className="pt-score__area">
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
                                            <span className="pt-score__bar">
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
                                        <li key={i} className="pt-score__row">
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
                            {report.valueRationale && <p className="pt-glance__text">{report.valueRationale}</p>}
                            {report.revealingDataPoints.length > 0 && (
                                <>
                                    <h3 className="pt-glance__list-title">
                                        {c('collider_2025:Title').t`Most revealing`}
                                    </h3>
                                    <ul className="pt-glance__highlights">
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
                <section className="pt-card">
                    <h2 className="pt-section-title">{c('collider_2025:Title').t`What we identified`}</h2>
                    <p className="pt-section-sub">
                        {c('collider_2025:Info')
                            .t`Inferences drawn only from your prompts — grouped by life area.`}
                    </p>
                    <div className="pt-identified-groups">
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
                                    <h3 id={`pt-identified-${sectionIndex}`} className="pt-identified-group__title">
                                        {section.title}
                                    </h3>
                                </div>
                                <ul className="pt-identified">
                                    {section.findings.map((finding, findingIndex) => (
                                        <li key={findingIndex} className="pt-identified__item">
                                            <div className="pt-identified__body">
                                                {finding.label && (
                                                    <span className="pt-identified__category">{finding.label}</span>
                                                )}
                                                <p className="pt-identified__detail">{finding.detail}</p>
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
                <section className="pt-panel pt-panel--compliance">
                    <h2 className="pt-section-title">{c('collider_2025:Title').t`Oversharing blind spots`}</h2>
                    <p className="pt-section-sub">
                        {c('collider_2025:Info')
                            .t`Some of what you pasted may cross workplace, legal, or data-protection lines. This is here to help you spot it, not to judge.`}
                    </p>
                    <ul className="pt-risks">
                        {report.complianceRisks.map((risk, i) => (
                            <li key={i} className="pt-risk">
                                <span className={`pt-risk__severity pt-risk__severity--${risk.severity}`}>
                                    {formatRiskSeverity(risk.severity)}
                                </span>
                                <h3 className="pt-risk__title">{risk.category}</h3>
                                <p className="pt-risk__detail">{risk.detail}</p>
                                {risk.guidance && (
                                    <div className="pt-risk__tip">
                                        <div className="pt-risk__tip-head">
                                            <LumoIcon name="Sparkles" size={14} className="pt-risk__tip-icon" />
                                            <span className="pt-risk__tip-label">{c('collider_2025:Label').t`Tips`}</span>
                                        </div>
                                        <p className="pt-risk__tip-text">{risk.guidance}</p>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section className="pt-panel pt-panel--warn">
                <h2 className="pt-section-title">{c('collider_2025:Title').t`Why this matters`}</h2>
                <p className="pt-section-sub">
                    {c('collider_2025:Info')
                        .t`This isn't just trivia. Here's what a profile like yours can actually be used for.`}
                </p>
                <ul className="pt-insights">
                    {risks.map((item, i) => (
                        <li key={i} className="pt-insight">
                            <span className="pt-insight__emoji" aria-hidden="true">
                                {item.emoji}
                            </span>
                            <div className="pt-insight__body">
                                <h3 className="pt-insight__title">{item.title}</h3>
                                <p className="pt-insight__detail">{item.detail}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="pt-panel pt-panel--tips">
                <h2 className="pt-section-title">{c('collider_2025:Title').t`How to stay private`}</h2>
                <p className="pt-section-sub">
                    {c('collider_2025:Info').t`A few habits go a long way to shrinking your paper trail.`}
                </p>
                <ul className="pt-insights">
                    {tips.map((item, i) => (
                        <li key={i} className="pt-insight">
                            <span className="pt-insight__emoji" aria-hidden="true">
                                {item.emoji}
                            </span>
                            <div className="pt-insight__body">
                                <h3 className="pt-insight__title">{item.title}</h3>
                                <p className="pt-insight__detail">{item.detail}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <SharePreview cardData={cardData} onShare={() => shareModal.openModal(true)} />

            <div className="pt-report__actions">
                <Button shape="ghost" size="large" pill onClick={onStartOver}>
                    {c('collider_2025:Action').t`Analyse another export`}
                </Button>
            </div>

            <div className="pt-report__cta-banner" style={{ backgroundImage: `url(${ctaContainerBg})` }}>
                <img src={lumoLogoWordmark} alt={LUMO_SHORT_APP_NAME} className="pt-report__cta-wordmark" />
                <p className="pt-report__cta-title">
                    {c('collider_2025:Title').t`You saw the profile? Now protect the person behind it.`}
                </p>
                <Button color="norm" size="large" pill onClick={onTryLumo}>
                    {c('collider_2025:Action').t`Try ${LUMO_SHORT_APP_NAME} for free`}
                </Button>
            </div>

            <p className="pt-report__footer">
                {c('collider_2025:Info')
                    .t`Built by ${BRAND_NAME}, the privacy brand trusted by over 100M people and the team behind ${MAIL_APP_NAME}, ${VPN_APP_NAME}, ${DRIVE_APP_NAME}, and ${PASS_APP_NAME}.`}
            </p>

            {shareModal.render && <ShareableCard data={cardData} {...shareModal.modalProps} />}

            {redFlagsModal.render && (
                <ModalTwo {...redFlagsModal.modalProps} size="small">
                    <ModalTwoHeader title={c('collider_2025:Title').t`What this profile exposes`} />
                    <ModalTwoContent>
                        <p className="color-weak mt-0">
                            {c('collider_2025:Info')
                                .t`These are the most sensitive categories Big Tech AI could infer about you from your chats.`}
                        </p>
                        <div className="pt-flag__tags pt-flag__tags--modal">
                            {report.sensitiveCategories.map((category, i) => (
                                <span key={i} className="pt-flag__tag">
                                    {category}
                                </span>
                            ))}
                        </div>
                    </ModalTwoContent>
                </ModalTwo>
            )}
        </div>
    );
};

export default PaperTrailReportView;
