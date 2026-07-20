import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

import type { PaperTrailCardData } from '../reportTypes';
import { loadLucideIconImage } from './lucideIconImage';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1080;

export type ShareCardTheme = 'dark' | 'light';

export const SHARE_CARD_URL = 'proton.me/lumo/aitrail';

const FONT_STACK = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

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
    iconBg: string;
    divider: string;
    border: string;
}

const PALETTES: Record<ShareCardTheme, Palette> = {
    light: {
        bg: '#ffffff',
        hero: '#f3efff',
        statsPanel: '#ffffff',
        title: '#1c1340',
        subtle: '#6b6a7b',
        label: '#8a849c',
        track: 'rgba(28, 19, 64, 0.08)',
        accent: '#6d4aff',
        ringTrack: 'rgba(109, 74, 255, 0.14)',
        footerBg: '#faf9fd',
        footerBorder: 'rgba(28, 19, 64, 0.08)',
        icon: '#6d4aff',
        iconBg: 'rgba(109, 74, 255, 0.1)',
        divider: 'rgba(28, 19, 64, 0.08)',
        border: 'rgba(28, 19, 64, 0.08)',
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
        iconBg: 'rgba(255, 255, 255, 0.08)',
        divider: 'rgba(255, 255, 255, 0.1)',
        border: 'rgba(255, 255, 255, 0.1)',
    },
};

interface ShareCardAssets {
    logo?: HTMLImageElement;
    privacyIcon?: HTMLImageElement;
    valueIcon?: HTMLImageElement;
}

const PADDING = 64;

const formatValue = (value: number): string => {
    if (!value || value <= 0) {
        return '$0';
    }
    if (value >= 1000) {
        return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
    }
    return `$${Math.round(value)}`;
};

export const privacyTypeLabel = (score: number): string => {
    if (score >= 70) {
        return 'Easy to read';
    }
    if (score >= 40) {
        return 'Somewhat readable';
    }
    return 'Hard to read';
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

const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
): void => {
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
    ctx.font = `700 18px ${FONT_STACK}`;
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
    const iconBox = 52;
    const iconX = x + 20;
    const iconY = y + (h - iconBox) / 2;

    roundRect(ctx, iconX, iconY, iconBox, iconBox, 14);
    ctx.fillStyle = palette.iconBg;
    ctx.fill();

    if (icon) {
        ctx.drawImage(icon, iconX + 10, iconY + 10, iconBox - 20, iconBox - 20);
    }

    const textX = iconX + iconBox + 18;
    drawLabel(ctx, label, textX, y + h / 2 - 10, palette.label);
    const valueSize = fitFont(ctx, value, 700, 34, 24, w - (textX - x) - 16);
    ctx.font = `700 ${valueSize}px ${FONT_STACK}`;
    ctx.fillStyle = palette.title;
    ctx.textAlign = 'left';
    ctx.fillText(value, textX, y + h / 2 + 28);
};

const drawShareCard = (
    ctx: CanvasRenderingContext2D,
    data: PaperTrailCardData,
    theme: ShareCardTheme,
    assets: ShareCardAssets
): void => {
    const cx = CARD_WIDTH / 2;
    const palette = PALETTES[theme];
    const contentW = CARD_WIDTH - PADDING * 2;

    ctx.save();
    roundRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, 32);
    ctx.clip();
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    ctx.restore();

    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, CARD_WIDTH - 2, CARD_HEIGHT - 2, 32);
    ctx.stroke();

    if (assets.logo) {
        const logoSize = 64;
        ctx.drawImage(assets.logo, cx - logoSize / 2, PADDING, logoSize, logoSize);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = palette.title;
    ctx.font = `700 48px ${FONT_STACK}`;
    ctx.fillText('My AI Paper Trail', cx, PADDING + 108);

    const heroX = PADDING;
    const heroY = PADDING + 136;
    const heroW = contentW;
    const heroH = 272;
    roundRect(ctx, heroX, heroY, heroW, heroH, 24);
    ctx.fillStyle = palette.hero;
    ctx.fill();

    const ringCx = heroX + heroW * 0.24;
    const ringTop = heroY + 36;
    const ringRadius = 78;

    ctx.textAlign = 'center';
    ctx.font = `600 22px ${FONT_STACK}`;
    ctx.fillStyle = palette.subtle;
    ctx.fillText('Privacy Exposure', ringCx, ringTop);

    const ringCy = ringTop + 28 + ringRadius;
    const startAngle = -Math.PI / 2;
    const fraction = Math.max(0, Math.min(1, data.exposureScore / 100));

    ctx.lineWidth = 12;
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
    ctx.font = `800 68px ${FONT_STACK}`;
    ctx.fillText(String(data.exposureScore), ringCx, ringCy - 6);
    ctx.font = `600 18px ${FONT_STACK}`;
    ctx.fillStyle = palette.subtle;
    ctx.fillText('OUT OF 100', ringCx, ringCy + 36);
    ctx.textBaseline = 'alphabetic';

    const statsX = heroX + heroW * 0.46;
    const statsY = heroY + 24;
    const statsW = heroW * 0.5;
    const statsH = heroH - 48;
    roundRect(ctx, statsX, statsY, statsW, statsH, 20);
    ctx.fillStyle = palette.statsPanel;
    ctx.fill();
    ctx.strokeStyle = palette.divider;
    ctx.lineWidth = 1;
    ctx.stroke();

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

    const sectionY = heroY + heroH + 52;
    ctx.textAlign = 'left';
    ctx.fillStyle = palette.title;
    ctx.font = `700 28px ${FONT_STACK}`;
    ctx.fillText('What AI Knows About Me', heroX, sectionY);

    const areas = data.areas.slice(0, 8);
    const half = Math.ceil(areas.length / 2);
    const colGap = 48;
    const colW = (heroW - colGap) / 2;
    const barHeight = 10;
    const rowGap = 68;
    const firstRowY = sectionY + 40;

    areas.forEach((area, i) => {
        const col = i < half ? 0 : 1;
        const rowIndex = i < half ? i : i - half;
        const colX = heroX + col * (colW + colGap);
        const y = firstRowY + rowIndex * rowGap;
        const areaColor = exposureBarColor(area.exposureScore, theme);

        ctx.font = `600 24px ${FONT_STACK}`;
        ctx.fillStyle = palette.title;
        ctx.textAlign = 'left';
        ctx.fillText(area.area, colX, y);
        ctx.fillStyle = areaColor;
        ctx.textAlign = 'right';
        ctx.fillText(String(area.exposureScore), colX + colW, y);

        const trackY = y + 14;
        ctx.fillStyle = palette.track;
        roundRect(ctx, colX, trackY, colW, barHeight, barHeight / 2);
        ctx.fill();
        const fillW = Math.max(barHeight, (colW * Math.max(0, Math.min(100, area.exposureScore))) / 100);
        ctx.fillStyle = areaColor;
        roundRect(ctx, colX, trackY, fillW, barHeight, barHeight / 2);
        ctx.fill();
    });

    const footerY = CARD_HEIGHT - PADDING - 56;
    const footerW = contentW;
    roundRect(ctx, heroX, footerY, footerW, 56, 16);
    ctx.fillStyle = palette.footerBg;
    ctx.fill();
    ctx.strokeStyle = palette.footerBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = `600 22px ${FONT_STACK}`;
    const footerPrefix = "What's your AI Paper Trail? ";
    ctx.fillStyle = palette.subtle;
    const prefixWidth = ctx.measureText(footerPrefix).width;
    const urlWidth = ctx.measureText(SHARE_CARD_URL).width;
    const footerStartX = cx - (prefixWidth + urlWidth) / 2;
    ctx.textAlign = 'left';
    ctx.fillText(footerPrefix, footerStartX, footerY + 36);
    ctx.fillStyle = palette.accent;
    ctx.fillText(SHARE_CARD_URL, footerStartX + prefixWidth, footerY + 36);
};

export const renderShareCard = async (
    canvas: HTMLCanvasElement,
    data: PaperTrailCardData,
    theme: ShareCardTheme
): Promise<void> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }

    const iconColor = PALETTES[theme].icon;
    const [logo, privacyIcon, valueIcon] = await Promise.all([
        loadImage(lumoCatIcon).catch(() => undefined),
        loadLucideIconImage('Zap', 32, iconColor).catch(() => undefined),
        loadLucideIconImage('BadgeDollarSign', 32, iconColor).catch(() => undefined),
    ]);

    drawShareCard(ctx, data, theme, { logo, privacyIcon, valueIcon });
};
