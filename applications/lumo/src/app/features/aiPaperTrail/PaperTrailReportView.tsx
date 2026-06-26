import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { ModalTwo, ModalTwoContent, ModalTwoHeader, useModalStateObject } from '@proton/components';
import { IcArrowUpFromSquare } from '@proton/icons/icons/IcArrowUpFromSquare';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

import { type PaperTrailReport, deriveCardData, toHandle } from './reportTypes';
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

export const PaperTrailReportView = ({ report, onStartOver, onTryLumo }: Props) => {
    const shareModal = useModalStateObject();
    const redFlagsModal = useModalStateObject();
    const cardData = deriveCardData(report);
    const hasRedFlags = report.sensitiveCategories.length > 0;

    const displayName = report.name || report.label;
    const handle = toHandle(report.name || report.label);
    const tags = report.sections.map((section) => section.title).filter(Boolean);

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
        <div className="pt-profile">
            {/* Header card */}
            <div className="pt-card pt-card--header">
                <div className="pt-header__cover">
                    <span className="pt-header__cover-label">{c('collider_2025:Info').t`Profiled by Big Tech AI`}</span>
                </div>
                <div className="pt-header__avatar pt-header__avatar--default">
                    <img src={lumoCatIcon} alt="" className="pt-header__avatar-lumo" />
                </div>
                <div className="pt-header__body">
                    <h2 className="pt-header__name">
                        {displayName}
                        <span className="pt-header__verified" aria-label="verified" title="Profiled by Big Tech AI">
                            ✓
                        </span>
                    </h2>
                    {report.name && <p className="pt-header__role">{report.label}</p>}
                    <p className="pt-header__handle">@{handle}</p>
                    {report.summary && <p className="pt-header__headline">{report.summary}</p>}
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
                    {tags.length > 0 && (
                        <div className="pt-header__tags">
                            {tags.map((tag, i) => (
                                <span key={i} className="pt-header__tag">
                                    #{tag.replace(/\s+/g, '')}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="pt-header__stats">
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
                </div>
            </div>

            <div className="pt-profile__columns">
                {/* Exposure scorecard */}
                {report.dataExposure.length > 0 && (
                    <div className="pt-card">
                        <div className="pt-card__head">
                            <h2 className="pt-card__title">{c('collider_2025:Title').t`Exposure scorecard`}</h2>
                            <div className="pt-score__overall">
                                <span className={`pt-score__overall-value ${exposureTone(cardData.exposureScore)}`}>
                                    {cardData.exposureScore}
                                    <span className="pt-score__overall-max">/100</span>
                                </span>
                                <span className="pt-score__overall-grade">{cardData.grade}</span>
                            </div>
                        </div>
                        <p className="pt-card__sub">
                            {c('collider_2025:Info')
                                .t`The fuller the bar, the more of that area Big Tech could reconstruct from your chats. Lower is better. Hover a row to see what gave it away.`}
                        </p>
                        <ul className="pt-score__list">
                            {report.dataExposure.map((exposure, i) => {
                                const exposureScore = Math.max(0, Math.min(100, exposure.score));
                                const row = (
                                    <span className="pt-score__row-inner">
                                        <span className="pt-score__area">
                                            {exposure.area}
                                            {exposure.detail && <IcInfoCircle className="pt-score__info" size={3.5} />}
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
                )}

                {/* Most revealing */}
                {report.revealingDataPoints.length > 0 && (
                    <div className="pt-card">
                        <div className="pt-card__head">
                            <h2 className="pt-card__title">{c('collider_2025:Title').t`Most revealing`}</h2>
                        </div>
                        <ul className="pt-card__list">
                            {report.revealingDataPoints.map((point, i) => (
                                <li key={i}>{point}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* What Big Tech inferred (full width, multi-column sections) */}
            <div className="pt-card">
                <div className="pt-card__head">
                    <h2 className="pt-card__title">{c('collider_2025:Title').t`What Big Tech inferred`}</h2>
                </div>
                {report.valueRationale && <p className="pt-card__sub">{report.valueRationale}</p>}
                <div className="pt-exp">
                    {report.sections.map((section, i) => (
                        <section key={`${section.title}-${i}`} className="pt-exp__group">
                            <div className="pt-exp__head">
                                <span className="pt-exp__icon" aria-hidden="true">
                                    {section.emoji || '📌'}
                                </span>
                                <h3 className="pt-exp__title">{section.title}</h3>
                            </div>
                            <div className="pt-exp__findings">
                                {section.findings.map((finding, j) => (
                                    <div key={j} className="pt-exp__finding">
                                        {finding.label && <span className="pt-exp__tag">{finding.label}</span>}
                                        <span className="pt-exp__detail">{finding.detail}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>

            {/* Compliance blind spots (educational) */}
            {report.complianceRisks.length > 0 && (
                <div className="pt-card pt-card--compliance">
                    <div className="pt-card__head">
                        <h2 className="pt-card__title">{c('collider_2025:Title').t`Oversharing blind spots`}</h2>
                    </div>
                    <p className="pt-card__sub">
                        {c('collider_2025:Info')
                            .t`Heads up — some of what you pasted may cross common workplace, legal, or data-protection lines. This is here to help you spot it, not to judge.`}
                    </p>
                    <ul className="pt-risks">
                        {report.complianceRisks.map((risk, i) => (
                            <li key={i} className="pt-risk">
                                <div className="pt-risk__head">
                                    <span className={`pt-risk__severity pt-risk__severity--${risk.severity}`}>
                                        {risk.severity}
                                    </span>
                                    <span className="pt-risk__category">{risk.category}</span>
                                </div>
                                <p className="pt-risk__detail">{risk.detail}</p>
                                {risk.guidance && (
                                    <p className="pt-risk__guidance">
                                        <span className="pt-risk__guidance-label">
                                            {c('collider_2025:Label').t`Tip`}
                                        </span>
                                        {risk.guidance}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="pt-profile__pair">
                {/* What they can do with this */}
                <div className="pt-card">
                    <div className="pt-card__head">
                        <h2 className="pt-card__title">{c('collider_2025:Title').t`Why this matters`}</h2>
                    </div>
                    <p className="pt-card__sub">
                        {c('collider_2025:Info')
                            .t`This isn't just trivia. Here's what a profile like yours can actually be used for.`}
                    </p>
                    <ul className="pt-points">
                        {risks.map((item, i) => (
                            <li key={i} className="pt-point">
                                <span className="pt-point__icon" aria-hidden="true">
                                    {item.emoji}
                                </span>
                                <span className="pt-point__content">
                                    <span className="pt-point__title">{item.title}</span>
                                    <span className="pt-point__detail">{item.detail}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* How to stay private */}
                <div className="pt-card pt-card--tips">
                    <div className="pt-card__head">
                        <h2 className="pt-card__title">{c('collider_2025:Title').t`How to stay private`}</h2>
                    </div>
                    <p className="pt-card__sub">
                        {c('collider_2025:Info').t`A few habits go a long way to shrinking your paper trail.`}
                    </p>
                    <ul className="pt-points">
                        {tips.map((item, i) => (
                            <li key={i} className="pt-point">
                                <span className="pt-point__icon pt-point__icon--good" aria-hidden="true">
                                    {item.emoji}
                                </span>
                                <span className="pt-point__content">
                                    <span className="pt-point__title">{item.title}</span>
                                    <span className="pt-point__detail">{item.detail}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Actions + CTA */}
            <div className="pt-card pt-card--cta">
                <div className="pt-cta__actions">
                    <Button color="norm" size="large" pill onClick={() => shareModal.openModal(true)}>
                        <IcArrowUpFromSquare className="mr-2" />
                        {c('collider_2025:Action').t`Create shareable card`}
                    </Button>
                    <Button shape="ghost" size="large" pill onClick={onStartOver}>
                        {c('collider_2025:Action').t`Analyse another export`}
                    </Button>
                </div>
                <p className="pt-cta__title">{c('collider_2025:Title').t`You saw the profile?`}</p>
                <p className="pt-cta__sub">
                    {c('collider_2025:Info')
                        .t`Now protect the person behind it.`}
                </p>
                <Button color="norm" size="large" pill className="mt-4" onClick={onTryLumo}>
                    {c('collider_2025:Action').t`Try ${LUMO_SHORT_APP_NAME} free`}
                </Button>
            </div>

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
