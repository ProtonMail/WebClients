import type { CSSProperties, ReactNode } from 'react';

import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';
import clsx from '@proton/utils/clsx';

import type { IconName } from '../../components/LumoIcon/LumoIcon';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';

/*
 * Right-hand illustrations of the desktop app tour, built from markup (not exported images) so the
 * example text is translated and the mockups follow the theme. All are decorative: the step's
 * heading and description carry the meaning, so each one is aria-hidden.
 */

/** Hero icons in steps 2–4 are 11px at Figma's ~0.84px stroke, which is about 1.8 on Lucide's 24px grid. */
const HERO_STROKE = 1.8;

interface PanelProps {
    children: ReactNode;
    /** Figma's 20/32px padding; off for the all-set drawing, which is taller than the column and centered on it. */
    padded?: boolean;
}

/** The lavender column used by steps 1, 5 and 6. */
const FillPanel = ({ children, padded = true }: PanelProps) => {
    return (
        <div
            className={clsx(
                'dao-fill flex flex-column flex-nowrap items-center justify-center gap-4 h-full overflow-hidden',
                padded && 'px-5 py-8'
            )}
            aria-hidden="true"
        >
            {children}
        </div>
    );
};

type GlowVariant = 'connectors' | 'skills' | 'schedules';

interface HeroProps {
    glow: GlowVariant;
    children: ReactNode;
}

/** The glow-and-dots stage of steps 2–4, a 400×400 square 40px from the top of the column. */
const Hero = ({ glow, children }: HeroProps) => {
    return (
        <div className="dao-canvas relative h-full overflow-hidden" aria-hidden="true">
            <div className="dao-hero absolute overflow-hidden">
                <div className={clsx('dao-glow absolute', `dao-glow--${glow}`)} />
                <div className="dao-dots absolute" />
                {children}
            </div>
        </div>
    );
};

const LumoCat = () => {
    return <img src={lumoCatIcon} alt="" />;
};

// --- Step 1 · Private AI --------------------------------------------------------------------

export const WelcomeIllustration = () => {
    const promises: { icon: IconName; label: string }[] = [
        { icon: 'Lock', label: c('collider_2025: Label').t`Zero-access encryption` },
        { icon: 'ShieldCheck', label: c('collider_2025: Label').t`Never used to train AI` },
        { icon: 'Shield', label: c('collider_2025: Label').t`No ads or tracking` },
    ];
    return (
        <FillPanel>
            <div className="dao-app-icon dao-app-icon--welcome flex items-center justify-center shrink-0">
                <LumoCat />
            </div>
            <ul className="unstyled m-0 flex flex-column flex-nowrap items-center gap-2">
                {promises.map((promise) => {
                    return (
                        <li
                            key={promise.icon}
                            className="dao-promise dao-medium flex flex-nowrap items-center gap-1.5 bg-norm rounded-full color-norm text-nowrap"
                        >
                            <LumoIcon name={promise.icon} size={14} strokeWidth={1.4} className="color-primary" />
                            {promise.label}
                        </li>
                    );
                })}
            </ul>
        </FillPanel>
    );
};

// --- Step 2 · Connectors ----------------------------------------------------------------------

interface ItineraryRowProps {
    icon: IconName;
    children: ReactNode;
}

const ItineraryRow = ({ icon, children }: ItineraryRowProps) => {
    return (
        <div className="dao-itinerary-row dao-medium flex flex-nowrap items-center w-full">
            <span className="dao-itinerary-icon flex items-center justify-center shrink-0">
                <LumoIcon name={icon} size={11} strokeWidth={HERO_STROKE} />
            </span>
            {children}
        </div>
    );
};

const ItineraryDay = ({ barWidth, children }: { barWidth: number; children: ReactNode }) => {
    return (
        <div className="dao-itinerary-day flex flex-column flex-nowrap w-full">
            <span className="dao-itinerary-day-bar" style={{ inlineSize: `${barWidth / 16}rem` }} />
            {children}
        </div>
    );
};

const ItineraryDivider = () => {
    return <span className="dao-itinerary-divider w-full shrink-0" />;
};

export const ConnectorsIllustration = () => {
    return (
        <Hero glow="connectors">
            <div className="dao-itinerary absolute flex flex-column flex-nowrap overflow-hidden">
                <div className="flex flex-nowrap items-center justify-space-between w-full">
                    <span className="dao-bar" style={{ inlineSize: '3.625rem' }} />
                    <span className="dao-itinerary-sources dao-medium flex flex-nowrap items-center text-nowrap">
                        <LumoIcon name="File" size={9} strokeWidth={HERO_STROKE} className="color-primary" />
                        {
                            // translator: Example chip in an illustration: the trip plan was built from 3 connected sources (an email, a booking, a file).
                            c('collider_2025: Illustration').t`3 sources`
                        }
                    </span>
                </div>
                <span className="dao-itinerary-city text-semibold text-nowrap">
                    {
                        // translator: Example trip destination shown in an illustration of a plan Lumo built from the user's emails.
                        c('collider_2025: Illustration').t`Mexico City`
                    }
                </span>
                <ItineraryDay barWidth={40}>
                    <ItineraryRow icon="Plane">
                        {
                            // translator: Example flight in an illustration. "AF 178" is a flight number; keep it as is.
                            c('collider_2025: Illustration').t`Flight AF 178 · Paris → Mexico City`
                        }
                    </ItineraryRow>
                    <ItineraryRow icon="BedDouble">
                        {
                            // translator: Example hotel name in an illustration; a proper name, usually kept as is.
                            c('collider_2025: Illustration').t`Hotel Casa Roma`
                        }
                    </ItineraryRow>
                </ItineraryDay>
                <ItineraryDivider />
                <ItineraryDay barWidth={44}>
                    <ItineraryRow icon="Ticket">
                        {
                            // translator: Example sightseeing stop in an illustration (the ancient city near Mexico City).
                            c('collider_2025: Illustration').t`Teotihuacán`
                        }
                    </ItineraryRow>
                </ItineraryDay>
                <ItineraryDivider />
                <ItineraryDay barWidth={42}>
                    <ItineraryRow icon="Utensils">
                        <span className="flex flex-nowrap items-center gap-1.5">
                            {
                                // translator: Example restaurant booking in an illustration of a trip plan.
                                c('collider_2025: Illustration').t`Dinner`
                            }
                            <span className="dao-bar" style={{ inlineSize: '3rem' }} />
                        </span>
                    </ItineraryRow>
                </ItineraryDay>
                <ItineraryDivider />
                <ItineraryDay barWidth={44}>
                    <ItineraryRow icon="Plane">
                        {
                            // translator: Example return flight in an illustration. "AF 179" is a flight number; keep it as is.
                            c('collider_2025: Illustration').t`Flight AF 179 · Mexico City → Paris`
                        }
                    </ItineraryRow>
                </ItineraryDay>
            </div>
        </Hero>
    );
};

// --- Step 3 · Skills --------------------------------------------------------------------------

/** Spent and budget column heights (px) for six months, from Figma. */
const BUDGET_MONTHS: [number, number][] = [
    [22, 16],
    [27, 19],
    [17, 20],
    [32, 22],
    [24, 17],
    [29, 23],
];

export const SkillsIllustration = () => {
    return (
        <Hero glow="skills">
            <div className="dao-chat-panel absolute" />
            <div className="dao-chat-attachment absolute flex flex-nowrap items-center">
                <span className="dao-chat-sheet flex items-center justify-center shrink-0">
                    <span className="dao-chat-sheet-cells">
                        {[0, 1, 2, 3, 4, 5].map((cell) => {
                            return <span key={cell} />;
                        })}
                    </span>
                </span>
                <span className="flex flex-column flex-nowrap gap-1">
                    <span className="dao-bar" style={{ inlineSize: '3.5rem' }} />
                    <span className="dao-bar dao-bar--weak" style={{ inlineSize: '1.875rem' }} />
                </span>
            </div>
            <div className="dao-chat-message absolute text-nowrap">
                {
                    // translator: Example request in an illustration of a chat where Lumo used a "Budget" skill on an attached spreadsheet.
                    c('collider_2025: Illustration').t`Make a budget from this file.`
                }
            </div>
            <div className="dao-chat-skill dao-medium absolute flex flex-nowrap items-center text-nowrap">
                <LumoIcon name="ScrollText" size={10} strokeWidth={HERO_STROKE} />
                {
                    // translator: Example chip in an illustration showing which skill Lumo used to answer.
                    c('collider_2025: Illustration').t`Budget skill`
                }
            </div>
            <div className="dao-chat-chart absolute flex flex-column flex-nowrap">
                <div className="flex flex-nowrap items-center justify-space-between w-full">
                    <span className="dao-bar" style={{ inlineSize: '4rem' }} />
                    <span className="flex flex-nowrap items-center gap-0.5">
                        <span className="dao-chat-legend-dot dao-chat-column--spent" />
                        <span className="dao-chat-legend-bar" />
                        <span className="dao-chat-legend-dot dao-chat-column--budget" />
                        <span className="dao-chat-legend-bar" />
                    </span>
                </div>
                <div className="flex flex-nowrap items-end gap-3">
                    {BUDGET_MONTHS.map(([spent, budget], index) => {
                        return (
                            <span key={index} className="flex flex-column flex-nowrap items-center gap-1">
                                <span className="flex flex-nowrap items-end gap-0.5">
                                    <span
                                        className="dao-chat-column dao-chat-column--spent"
                                        style={{ blockSize: `${spent / 16}rem` }}
                                    />
                                    <span
                                        className="dao-chat-column dao-chat-column--budget"
                                        style={{ blockSize: `${budget / 16}rem` }}
                                    />
                                </span>
                                <span className="dao-chat-month-label" />
                            </span>
                        );
                    })}
                </div>
            </div>
            <div className="dao-chat-avatar absolute flex justify-center rounded-full overflow-hidden">
                <LumoCat />
            </div>
            <div className="dao-chat-typing absolute flex flex-nowrap items-center justify-center rounded-full">
                <span />
                <span />
                <span />
            </div>
            <div className="dao-chat-composer absolute flex flex-nowrap items-center">
                <LumoIcon name="Plus" size={9} strokeWidth={HERO_STROKE} className="m-0.5" />
                <LumoIcon name="SlidersHorizontal" size={8} strokeWidth={HERO_STROKE} className="mx-1" />
                <span className="flex-1" />
                <span className="dao-chat-send flex rounded-full">
                    <LumoIcon name="ArrowUp" size={9} strokeWidth={HERO_STROKE} />
                </span>
            </div>
        </Hero>
    );
};

// --- Step 4 · Schedules -----------------------------------------------------------------------

const Sparkline = () => {
    return (
        <svg width="40" height="12" viewBox="0 0 41.2 13.2" fill="none" className="shrink-0">
            <path
                d="M0.6 12.6L6.6 9.6L11.6 10.6L17.6 6.6L22.6 7.6L28.6 3.6L34.6 4.6L40.6 0.6"
                stroke="var(--dao-green)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

interface ScheduledTaskProps {
    icon: IconName;
    tone: 'green' | 'brand' | 'pink';
    name: string;
    detailWidth: number;
    trailing: ReactNode;
    time: string;
}

const ScheduledTask = ({ icon, tone, name, detailWidth, trailing, time }: ScheduledTaskProps) => {
    return (
        <div className="dao-schedules-task flex flex-nowrap items-center w-full">
            <span
                className={clsx(
                    'dao-schedules-icon flex items-center justify-center shrink-0',
                    `dao-schedules-icon--${tone}`
                )}
            >
                <LumoIcon name={icon} size={11} strokeWidth={HERO_STROKE} />
            </span>
            <span className="flex flex-column flex-nowrap flex-1 gap-1 min-w-0">
                <span className="dao-schedules-name text-semibold text-nowrap">{name}</span>
                <span className="dao-bar dao-bar--weak" style={{ inlineSize: `${detailWidth / 16}rem` }} />
            </span>
            {trailing}
            <span className="dao-schedules-time dao-medium">{time}</span>
        </div>
    );
};

export const SchedulesIllustration = () => {
    return (
        <Hero glow="schedules">
            <div className="dao-schedules absolute flex flex-column flex-nowrap overflow-hidden">
                <div className="flex flex-nowrap items-center gap-1.5">
                    <LumoIcon name="Repeat" size={11} strokeWidth={HERO_STROKE} />
                    <span className="dao-bar" style={{ inlineSize: '4rem' }} />
                </div>
                <span className="dao-schedules-divider w-full" />
                <ScheduledTask
                    icon="TrendingUp"
                    tone="green"
                    // translator: Example name of a scheduled task in an illustration (a daily stock market summary).
                    name={c('collider_2025: Illustration').t`Stock market`}
                    detailWidth={70}
                    trailing={<Sparkline />}
                    time="09:00"
                />
                <span className="dao-schedules-divider w-full" />
                <ScheduledTask
                    icon="TrainFront"
                    tone="brand"
                    // translator: Example name of a scheduled task in an illustration (a daily check of the user's train).
                    name={c('collider_2025: Illustration').t`Train status`}
                    detailWidth={56}
                    trailing={
                        <span className="dao-schedules-status flex flex-nowrap items-center rounded-full shrink-0">
                            <span className="dao-schedules-status-dot" />
                            <span className="dao-schedules-status-bar" />
                        </span>
                    }
                    time="07:30"
                />
                <span className="dao-schedules-divider w-full" />
                <ScheduledTask
                    icon="Mail"
                    tone="pink"
                    // translator: Example name of a scheduled task in an illustration (a daily summary of new emails).
                    name={c('collider_2025: Illustration').t`Email check`}
                    detailWidth={64}
                    trailing={<span className="dao-schedules-badge text-semibold shrink-0">3</span>}
                    time="18:00"
                />
            </div>
        </Hero>
    );
};

// --- Step 5 · Notifications -------------------------------------------------------------------

interface NotificationBannerProps {
    title: string;
    time: string;
    body: string;
    older?: boolean;
}

const NotificationBanner = ({ title, time, body, older = false }: NotificationBannerProps) => {
    return (
        <div
            className={clsx(
                'dao-notification flex flex-nowrap items-center shrink-0',
                older && 'dao-notification--older'
            )}
        >
            <LumoCat />
            <div className="flex flex-column flex-nowrap flex-1 min-w-0 color-norm">
                <div className="flex flex-nowrap items-start gap-2">
                    <span className="flex-1 text-semibold">{title}</span>
                    <span className="dao-notification-time color-weak text-nowrap">{time}</span>
                </div>
                <span>{body}</span>
            </div>
        </div>
    );
};

export const NotificationsIllustration = () => {
    return (
        <FillPanel>
            <NotificationBanner
                // translator: Example desktop notification title in an illustration: a scheduled morning briefing has finished.
                title={c('collider_2025: Illustration').t`Morning brief is ready`}
                // translator: Time label of an example notification, as macOS shows it for one that just arrived.
                time={c('collider_2025: Illustration').t`now`}
                // translator: Example desktop notification text in an illustration of a morning briefing.
                body={c('collider_2025: Illustration').t`3 meetings today. 2 emails need a reply.`}
            />
            <NotificationBanner
                older
                // translator: Example desktop notification title in an illustration: Lumo is waiting for the user to approve a recap.
                title={c('collider_2025: Illustration').t`Approve your weekly recap`}
                // translator: Time label of an example notification that arrived 2 minutes ago, as macOS shows it.
                time={c('collider_2025: Illustration').t`2m ago`}
                // translator: Example desktop notification text. ${LUMO_SHORT_APP_NAME} is the app name; Slack is the chat app.
                body={c('collider_2025: Illustration').t`Review it in ${LUMO_SHORT_APP_NAME} before sharing to Slack.`}
            />
        </FillPanel>
    );
};

// --- Step 6 · Free users: Lumo Plus -----------------------------------------------------------

export const PlusPlanIllustration = () => {
    // Same strings (and context) as the Plus card in Settings, so they're already translated.
    const features: { icon: IconName; label: string }[] = [
        { icon: 'Lightbulb', label: c('collider_2025: Characteristic').t`More Max model usage` },
        { icon: 'MessageCircleMore', label: c('collider_2025: Characteristic').t`More messages & chat history` },
        { icon: 'ImagePlus', label: c('collider_2025: Characteristic').t`More image generations` },
        { icon: 'FolderOpen', label: c('collider_2025: Characteristic').t`Unlimited Projects` },
        { icon: 'Bot', label: c('collider_2025: Characteristic').t`Unlimited skills` },
    ];
    return (
        <FillPanel>
            <div className="dao-plan flex flex-column flex-nowrap bg-norm color-norm">
                <span className="dao-plan-name text-semibold">{c('collider_2025: Plan Name').t`Plus`}</span>
                <ul className="dao-plan-features unstyled m-0 flex flex-column flex-nowrap">
                    {features.map((feature) => {
                        return (
                            <li key={feature.icon} className="dao-plan-feature flex flex-nowrap items-center">
                                <LumoIcon name={feature.icon} size={18} strokeWidth={1.4} className="shrink-0" />
                                {feature.label}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </FillPanel>
    );
};

// --- Step 6 · Everyone else: all set ----------------------------------------------------------

/** Piece centers (px), sizes and rotations from Figma's "All set illustration" (901:7569). */
const RINGS = [
    { size: 300, opacity: 0.06 },
    { size: 224, opacity: 0.1 },
    { size: 152, opacity: 0.16 },
];

interface Confetti {
    x: number;
    y: number;
    color: string;
    shape: 'dot' | 'wide' | 'tall';
    rotate: number;
}

const CONFETTI: Confetti[] = [
    { x: 45.1, y: 62.4, color: '#6e4aff', shape: 'dot', rotate: 0 },
    { x: 304, y: 53.2, color: '#ff6b9e', shape: 'wide', rotate: 30 },
    { x: 338.4, y: 172.1, color: '#ffc233', shape: 'tall', rotate: -45 },
    { x: 27.5, y: 248.5, color: '#29bfb0', shape: 'dot', rotate: 0 },
    { x: 91.3, y: 36.6, color: '#8c78ff', shape: 'tall', rotate: 15 },
    { x: 276.5, y: 379.7, color: '#6e4aff', shape: 'wide', rotate: -25 },
    { x: 60.5, y: 375.6, color: '#ff6b9e', shape: 'dot', rotate: 0 },
    { x: 356.3, y: 301.4, color: '#ffc233', shape: 'wide', rotate: -10 },
    { x: 186.7, y: 19.2, color: '#29bfb0', shape: 'tall', rotate: -70 },
    { x: 142.4, y: 415.1, color: '#8c78ff', shape: 'dot', rotate: 0 },
    { x: 235.9, y: 73.2, color: '#6e4aff', shape: 'tall', rotate: -35 },
    { x: 321.4, y: 116.3, color: '#ff6b9e', shape: 'wide', rotate: 55 },
    { x: 34.9, y: 152.8, color: '#ffc233', shape: 'dot', rotate: 0 },
    { x: 115.8, y: 337, color: '#29bfb0', shape: 'wide', rotate: -50 },
];

const CONFETTI_SIZE: Record<Confetti['shape'], [number, number]> = {
    dot: [8, 8],
    wide: [12, 5],
    tall: [6, 12],
};

/** All pieces are centered on the rings at (190, 210). */
const CENTER = { x: 190, y: 210 };

const position = (x: number, y: number, extra: CSSProperties = {}): CSSProperties => {
    return { '--x': `${x / 16}rem`, '--y': `${y / 16}rem`, ...extra } as CSSProperties;
};

interface ReadyChipProps {
    icon: IconName;
    label: string;
    y: number;
    /** Distance of the chip's left edge from the drawing's left edge, for chips on the left side. */
    left?: number;
    /** Distance of the chip's right edge from the drawing's right edge, for chips on the right side. */
    right?: number;
}

/**
 * Left-side chips are anchored on their left edge and right-side chips on their right edge (positions
 * from the English render of Figma), so longer translations grow towards the middle, not off the canvas.
 */
const ReadyChip = ({ icon, label, y, left, right }: ReadyChipProps) => {
    const style = {
        '--y': `${y / 16}rem`,
        ...(right === undefined ? { '--x': `${(left ?? 0) / 16}rem` } : { insetInlineEnd: `${right / 16}rem` }),
    } as CSSProperties;
    return (
        <span
            className={clsx(
                'dao-all-set-chip dao-medium absolute flex flex-nowrap items-center bg-norm rounded-full color-norm text-nowrap',
                right !== undefined && 'dao-all-set-chip--end'
            )}
            style={style}
        >
            <LumoIcon name={icon} size={14} strokeWidth={1.4} className="shrink-0" />
            {label}
            <span className="dao-all-set-check flex shrink-0 items-center justify-center rounded-full">
                <LumoIcon name="Check" size={12} strokeWidth={1.4} />
            </span>
        </span>
    );
};

export const AllSetIllustration = () => {
    return (
        <FillPanel padded={false}>
            <div className="dao-all-set relative shrink-0">
                {RINGS.map((ring) => {
                    return (
                        <span
                            key={ring.size}
                            className="dao-all-set-piece dao-all-set-ring absolute"
                            style={position(CENTER.x, CENTER.y, {
                                inlineSize: `${ring.size / 16}rem`,
                                blockSize: `${ring.size / 16}rem`,
                                opacity: ring.opacity,
                            })}
                        />
                    );
                })}
                {CONFETTI.map((piece, index) => {
                    const [width, height] = CONFETTI_SIZE[piece.shape];
                    return (
                        <span
                            key={index}
                            className={clsx(
                                'dao-all-set-piece dao-all-set-confetti absolute',
                                piece.shape === 'dot' && 'dao-all-set-confetti--dot'
                            )}
                            style={position(piece.x, piece.y, {
                                inlineSize: `${width / 16}rem`,
                                blockSize: `${height / 16}rem`,
                                backgroundColor: piece.color,
                                '--r': `${piece.rotate}deg`,
                                '--delay': `${(index % 7) * 0.04}s`,
                            } as CSSProperties)}
                        />
                    );
                })}
                <span
                    className="dao-all-set-piece dao-app-icon dao-app-icon--all-set absolute flex items-center justify-center"
                    style={position(CENTER.x, CENTER.y)}
                >
                    <LumoCat />
                </span>
                <span
                    className="dao-all-set-piece dao-all-set-sparkle absolute flex color-primary"
                    style={position(262, 140)}
                >
                    <LumoIcon name="Sparkles" size={24} strokeWidth={1.4} />
                </span>
                <span
                    className="dao-all-set-piece dao-all-set-sparkle absolute flex color-primary"
                    style={position(120, 270, { '--delay': '0.1s' } as CSSProperties)}
                >
                    <LumoIcon name="Sparkles" size={16} strokeWidth={1.4} />
                </span>
                <ReadyChip icon="Blocks" label={c('collider_2025: Title').t`Connectors`} left={18} y={92} />
                <ReadyChip icon="Clock" label={c('collider_2025: Title').t`Schedules`} right={7} y={196} />
                <ReadyChip icon="ScrollText" label={c('collider_2025: Title').t`Skills`} left={30} y={300} />
                <ReadyChip
                    icon="Bell"
                    // translator: Chip in a "you're all set" illustration: desktop notifications are turned on.
                    label={c('collider_2025: Label').t`Notifications on`}
                    right={25}
                    y={330}
                />
            </div>
        </FillPanel>
    );
};
