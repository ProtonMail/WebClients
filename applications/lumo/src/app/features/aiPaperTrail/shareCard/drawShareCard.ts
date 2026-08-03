import lumoSideeyeIcon from '@proton/styles/assets/img/lumo/lumo-sideeye.svg';

import type { PaperTrailCardData } from '../reportTypes';
import { privacyTypeLabel } from '../reportTypes';
import { loadLucideIconImage } from './lucideIconImage';

export const CARD_WIDTH = 1080;

/** Default height for layouts with 8 exposure areas — use `computeShareCardHeight` for the actual value. */
export const CARD_HEIGHT = 1064;

export type ShareCardTheme = 'dark' | 'light';

export interface ShareCardRenderOptions {
    hideFooter?: boolean;
}

export const SHARE_CARD_URL = 'proton.me/lumo/aitrail';

const FONT_STACK = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
const SYNE_FONT = `Syne, ${FONT_STACK}`;

const LAYOUT = {
    padding: 42,
    logoSize: 128,
    logoToTitle: 16,
    titleSize: 44,
    titleToHero: 32,
    heroHeight: 292,
    heroRadius: 24,
    cardPad: 28,
    heroColGap: 12,
    heroLeftRatio: 0.28,
    sectionGap: 48,
    knowledgePadX: 28,
    knowledgePadTop: 28,
    knowledgePadBottom: 32,
    knowledgeTitleGap: 36,
    knowledgeRowGap: 76,
    barHeight: 16,
    labelToBar: 18,
    colGap: 48,
    footerHeight: 52,
    footerGap: 28,
    ringRadius: 86,
    ringStroke: 12,
    statsRadius: 16,
} as const;

interface Palette {
    bg: string;
    hero: string;
    statsPanel: string;
    title: string;
    subtle: string;
    label: string;
    track: string;
    accent: string;
    ringTrack: string;
    footerBg: string;
    footerBorder: string;
    icon: string;
    divider: string;
    border: string;
}

const PALETTES: Record<ShareCardTheme, Palette> = {
    light: {
        bg: '#ffffff',
        hero: '#f3efff',
        statsPanel: '#F3F0FF',
        title: '#372580',
        subtle: '#6b6a7b',
        label: '#6B6A7B',
        track: 'rgba(109, 74, 255, 0.12)',
        accent: '#6d4aff',
        ringTrack: 'rgba(109, 74, 255, 0.14)',
        footerBg: '#faf9fd',
        footerBorder: 'rgba(28, 19, 64, 0.08)',
        icon: '#372580',
        divider: 'rgba(109, 74, 255, 0.16)',
        border: 'rgba(28, 19, 64, 0.1)',
    },
    dark: {
        bg: '#1b1340',
        hero: 'rgba(255, 255, 255, 0.06)',
        statsPanel: 'rgba(255, 255, 255, 0.04)',
        title: '#ffffff',
        subtle: '#cdbcff',
        label: '#b9a7ff',
        track: 'rgba(255, 255, 255, 0.12)',
        accent: '#b9a7ff',
        ringTrack: 'rgba(255, 255, 255, 0.12)',
        footerBg: 'rgba(255, 255, 255, 0.04)',
        footerBorder: 'rgba(255, 255, 255, 0.1)',
        icon: '#b9a7ff',
        divider: 'rgba(255, 255, 255, 0.1)',
        border: 'rgba(255, 255, 255, 0.1)',
    },
};

interface ShareCardAssets {
    logo?: HTMLImageElement;
    privacyIcon?: HTMLImageElement;
    valueIcon?: HTMLImageElement;
}

const formatValue = (value: number): string => {
    if (!value || value <= 0) {
        return '$0';
    }
    if (value >= 1000) {
        return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
    }
    return `$${Math.round(value)}`;
};

const exposureBarColor = (score: number, theme: ShareCardTheme): string => {
    if (theme === 'light') {
        if (score >= 70) {
            return '#d6443a';
        }
        if (score >= 40) {
            return '#d99500';
        }
        return '#1aa67a';
    }
    if (score >= 70) {
        return '#ff7a7a';
    }
    if (score >= 40) {
        return '#ffcf5c';
    }
    return '#b9a7ff';
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void => {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });

const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void => {
    ctx.font = `700 17px ${FONT_STACK}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(text.toUpperCase(), x, y);
};

const fitFont = (
    ctx: CanvasRenderingContext2D,
    text: string,
    weight: number,
    startPx: number,
    minPx: number,
    maxWidth: number
): number => {
    let size = startPx;
    ctx.font = `${weight} ${size}px ${FONT_STACK}`;
    while (ctx.measureText(text).width > maxWidth && size > minPx) {
        size -= 2;
        ctx.font = `${weight} ${size}px ${FONT_STACK}`;
    }
    return size;
};

const knowledgeRowCount = (areaCount: number): number => Math.max(Math.ceil(Math.min(areaCount, 8) / 2), 1);

const knowledgeCardHeight = (areaCount: number): number =>
    LAYOUT.knowledgePadTop +
    LAYOUT.knowledgeTitleGap +
    knowledgeRowCount(areaCount) * LAYOUT.knowledgeRowGap +
    LAYOUT.knowledgePadBottom;

export const computeShareCardHeight = (areaCount: number, options?: ShareCardRenderOptions): number => {
    const heroY = LAYOUT.padding + LAYOUT.logoSize + LAYOUT.logoToTitle + LAYOUT.titleSize + LAYOUT.titleToHero;
    const sectionY = heroY + LAYOUT.heroHeight + LAYOUT.sectionGap;
    const contentBottom = sectionY + knowledgeCardHeight(areaCount);

    if (options?.hideFooter) {
        return contentBottom + LAYOUT.padding;
    }

    const footerY = contentBottom + LAYOUT.footerGap;

    return footerY + LAYOUT.footerHeight + LAYOUT.padding;
};

const drawStatRow = (
    ctx: CanvasRenderingContext2D,
    palette: Palette,
    x: number,
    y: number,
    w: number,
    h: number,
    icon: HTMLImageElement | undefined,
    label: string,
    value: string
): void => {
    const iconBox = 64;
    const iconX = x + 20;
    const iconY = y + (h - iconBox) / 2;

    if (icon) {
        ctx.drawImage(icon, iconX + 8, iconY + 8, iconBox - 16, iconBox - 16);
    }

    const textX = iconX + iconBox + 14;
    const textMidY = y + h / 2;
    drawLabel(ctx, label, textX, textMidY - 16, palette.label);
    const valueSize = fitFont(ctx, value, 700, 28, 20, w - (textX - x) - 16);
    ctx.font = `600 ${valueSize * 1.1}px ${FONT_STACK}`;
    ctx.fillStyle = palette.title;
    ctx.textAlign = 'left';
    ctx.fillText(value, textX, textMidY + 22);
};

const drawShareCard = (
    ctx: CanvasRenderingContext2D,
    data: PaperTrailCardData,
    theme: ShareCardTheme,
    assets: ShareCardAssets,
    cardHeight: number,
    options?: ShareCardRenderOptions
): void => {
    const cx = CARD_WIDTH / 2;
    const palette = PALETTES[theme];
    const contentW = CARD_WIDTH - LAYOUT.padding * 2;

    ctx.save();
    roundRect(ctx, 0, 0, CARD_WIDTH, cardHeight, 32);
    ctx.clip();
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, CARD_WIDTH, cardHeight);
    ctx.restore();

    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    roundRect(ctx, 0.5, 0.5, CARD_WIDTH - 1, cardHeight - 1, 32);
    ctx.stroke();

    const logoY = LAYOUT.padding;
    if (assets.logo) {
        ctx.drawImage(assets.logo, cx - LAYOUT.logoSize / 2, logoY, LAYOUT.logoSize, LAYOUT.logoSize);
    }

    const titleY = logoY + LAYOUT.logoSize + LAYOUT.logoToTitle + LAYOUT.titleSize;
    ctx.textAlign = 'center';
    ctx.fillStyle = palette.title;
    ctx.font = `700 ${LAYOUT.titleSize}px ${SYNE_FONT}`;
    ctx.fillText('My AI Paper Trail', cx, titleY);

    const heroX = LAYOUT.padding;
    const heroY = titleY + LAYOUT.titleToHero;
    const heroW = contentW;
    const heroH = LAYOUT.heroHeight;
    roundRect(ctx, heroX, heroY, heroW, heroH, LAYOUT.heroRadius);
    ctx.fillStyle = palette.bg;
    ctx.fill();
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    const heroInnerX = heroX + LAYOUT.cardPad;
    const heroInnerW = heroW - LAYOUT.cardPad * 2;
    const heroTitleY = heroY + LAYOUT.cardPad + 22;

    ctx.textAlign = 'left';
    ctx.font = `700 30px ${SYNE_FONT}`;
    ctx.fillStyle = palette.title;
    ctx.fillText('Privacy Exposure', heroInnerX, heroTitleY);

    const contentY = heroTitleY + 14;
    const contentH = heroY + heroH - LAYOUT.cardPad - contentY;
    const leftW = heroInnerW * LAYOUT.heroLeftRatio;
    const rightW = heroInnerW - leftW - LAYOUT.heroColGap;
    const ringCx = heroInnerX + leftW / 2;
    const ringCy = contentY + contentH / 2;
    const ringStroke = LAYOUT.ringStroke;
    const ringRadius = Math.min(LAYOUT.ringRadius, contentH / 2 - ringStroke - 4, leftW / 2 - 6);
    const startAngle = -Math.PI / 2;
    const fraction = Math.max(0, Math.min(1, data.exposureScore / 100));

    ctx.lineWidth = ringStroke;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(ringCx, ringCy, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = palette.ringTrack;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ringCx, ringCy, ringRadius, startAngle, startAngle + fraction * Math.PI * 2);
    ctx.strokeStyle = palette.accent;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = palette.title;
    ctx.font = `600 ${Math.round(ringRadius * 0.96)}px ${FONT_STACK}`;
    ctx.fillText(String(data.exposureScore), ringCx, ringCy - 8);
    ctx.font = `600 ${Math.round(ringRadius * 0.22)}px ${FONT_STACK}`;
    ctx.fillStyle = palette.subtle;
    ctx.fillText('OUT OF 100', ringCx, ringCy + ringRadius * 0.45);
    ctx.textBaseline = 'alphabetic';

    const statsX = heroInnerX + leftW + LAYOUT.heroColGap;
    const statsY = contentY;
    const statsW = rightW;
    const statsH = contentH;
    roundRect(ctx, statsX, statsY, statsW, statsH, LAYOUT.statsRadius);
    ctx.fillStyle = palette.statsPanel;
    ctx.fill();

    const rowH = statsH / 2;
    drawStatRow(
        ctx,
        palette,
        statsX,
        statsY,
        statsW,
        rowH,
        assets.privacyIcon,
        'My Privacy Type',
        privacyTypeLabel(data.exposureScore)
    );
    ctx.beginPath();
    ctx.moveTo(statsX + 20, statsY + rowH);
    ctx.lineTo(statsX + statsW - 20, statsY + rowH);
    ctx.strokeStyle = palette.divider;
    ctx.lineWidth = 1;
    ctx.stroke();
    drawStatRow(
        ctx,
        palette,
        statsX,
        statsY + rowH,
        statsW,
        rowH,
        assets.valueIcon,
        'My Data Value',
        formatValue(data.estimatedValueUsd)
    );

    const sectionY = heroY + heroH + LAYOUT.sectionGap;
    const areas = data.areas.slice(0, 8);
    const half = Math.ceil(areas.length / 2);
    const innerW = heroW - LAYOUT.knowledgePadX * 2;
    const colW = (innerW - LAYOUT.colGap) / 2;
    const knowledgeCardH = knowledgeCardHeight(areas.length);
    const knowledgeTitleY = sectionY + LAYOUT.knowledgePadTop + 22;
    const firstRowY = knowledgeTitleY + LAYOUT.knowledgeTitleGap + 22;

    roundRect(ctx, heroX, sectionY, heroW, knowledgeCardH, LAYOUT.heroRadius);
    ctx.fillStyle = palette.bg;
    ctx.fill();
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = palette.title;
    ctx.font = `800 24px ${FONT_STACK}`;
    ctx.fillText('What AI Knows About Me', heroX + LAYOUT.knowledgePadX, knowledgeTitleY);

    areas.forEach((area, i) => {
        const col = i < half ? 0 : 1;
        const rowIndex = i < half ? i : i - half;
        const colX = heroX + LAYOUT.knowledgePadX + col * (colW + LAYOUT.colGap);
        const y = firstRowY + rowIndex * LAYOUT.knowledgeRowGap;
        const areaColor = exposureBarColor(area.exposureScore, theme);
        const score = Math.max(0, Math.min(100, area.exposureScore));

        ctx.font = `400 24px ${FONT_STACK}`;
        ctx.fillStyle = palette.title;
        ctx.textAlign = 'left';
        ctx.fillText(area.area, colX, y);
        ctx.fillStyle = areaColor;
        ctx.textAlign = 'right';
        ctx.fillText(String(score), colX + colW, y);

        const trackY = y + LAYOUT.labelToBar;
        ctx.fillStyle = palette.track;
        roundRect(ctx, colX, trackY, colW, LAYOUT.barHeight, LAYOUT.barHeight / 2);
        ctx.fill();

        if (score > 0) {
            const fillW = Math.max(LAYOUT.barHeight, (colW * score) / 100);
            ctx.fillStyle = areaColor;
            roundRect(ctx, colX, trackY, fillW, LAYOUT.barHeight, LAYOUT.barHeight / 2);
            ctx.fill();
        }
    });

    if (!options?.hideFooter) {
        const footerY = sectionY + knowledgeCardH + LAYOUT.footerGap;
        const footerW = contentW;
        roundRect(ctx, heroX, footerY, footerW, LAYOUT.footerHeight, 14);
        ctx.fillStyle = palette.footerBg;
        ctx.fill();
        ctx.strokeStyle = palette.footerBorder;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = `600 26px ${FONT_STACK}`;
        const footerPrefix = "What's your AI Paper Trail? ";
        ctx.fillStyle = palette.subtle;
        const prefixWidth = ctx.measureText(footerPrefix).width;
        const urlWidth = ctx.measureText(SHARE_CARD_URL).width;
        const footerStartX = cx - (prefixWidth + urlWidth) / 2;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(footerPrefix, footerStartX, footerY + LAYOUT.footerHeight / 2);
        ctx.fillStyle = palette.accent;
        ctx.fillText(SHARE_CARD_URL, footerStartX + prefixWidth, footerY + LAYOUT.footerHeight / 2);
        ctx.textBaseline = 'alphabetic';
    }
};

export const renderShareCard = async (
    canvas: HTMLCanvasElement,
    data: PaperTrailCardData,
    theme: ShareCardTheme,
    options?: ShareCardRenderOptions
): Promise<void> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }

    const cardHeight = computeShareCardHeight(data.areas.length, options);
    canvas.width = CARD_WIDTH;
    canvas.height = cardHeight;

    const iconColor = PALETTES[theme].icon;
    const [logo, privacyIcon, valueIcon] = await Promise.all([
        loadImage(lumoSideeyeIcon).catch(() => undefined),
        loadLucideIconImage('Zap', 32, iconColor).catch(() => undefined),
        loadLucideIconImage('BadgeDollarSign', 32, iconColor).catch(() => undefined),
    ]);

    drawShareCard(ctx, data, theme, { logo, privacyIcon, valueIcon }, cardHeight, options);
};
