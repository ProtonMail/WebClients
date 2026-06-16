import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

import type { PaperTrailCardData } from '../reportTypes';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1080;

export type ShareCardTheme = 'dark' | 'light';

const FONT_STACK = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

interface Palette {
    bg: [string, string, string];
    eyebrow: string;
    title: string;
    subtle: string;
    track: string;
    /** Neutral panel behind the grade callout. */
    panel: string;
    panelLabel: string;
    /** Accent panel behind the "worth to Big Tech" callout. */
    callout: [string, string];
    calloutText: string;
    calloutSub: string;
    divider: string;
}

const PALETTES: Record<ShareCardTheme, Palette> = {
    dark: {
        bg: ['#1b1340', '#241653', '#0d0a1f'],
        eyebrow: '#b9a7ff',
        title: '#ffffff',
        subtle: '#cdbcff',
        track: 'rgba(255, 255, 255, 0.12)',
        panel: 'rgba(255, 255, 255, 0.06)',
        panelLabel: '#cdbcff',
        callout: ['#7c5cff', '#a07bff'],
        calloutText: '#ffffff',
        calloutSub: 'rgba(255, 255, 255, 0.82)',
        divider: 'rgba(255, 255, 255, 0.1)',
    },
    light: {
        bg: ['#f3efff', '#faf7ff', '#fdf2f6'],
        eyebrow: '#6d4aff',
        title: '#1c1340',
        subtle: '#6b6a7b',
        track: 'rgba(28, 19, 64, 0.08)',
        panel: 'rgba(28, 19, 64, 0.045)',
        panelLabel: '#6b6a7b',
        callout: ['#6d4aff', '#8f6bff'],
        calloutText: '#d6443a',
        calloutSub: '#6b6a7b',
        divider: 'rgba(28, 19, 64, 0.1)',
    },
};

const formatValue = (value: number): string => {
    if (!value || value <= 0) {
        return '$0';
    }
    if (value >= 1000) {
        return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
    }
    return `$${Math.round(value)}`;
};

// Exposure colour: higher = more exposed = worse (red). Lower = safer (green).
const exposureColor = (score: number, theme: ShareCardTheme): string => {
    if (theme === 'light') {
        if (score >= 70) {
            return '#d6443a';
        }
        if (score >= 40) {
            return '#d99500';
        }
        return '#b9a7ff';
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

const MARGIN = 72;

/** Draw a small uppercase label, returning nothing. Assumes left text alignment. */
const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void => {
    ctx.font = `700 22px ${FONT_STACK}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(text.toUpperCase(), x, y);
};

/** Shrink the font until `text` fits within `maxWidth` (down to a floor), then return the px size used. */
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

/**
 * Draw the 1:1 square shareable card. Square is the safest universal format — it
 * displays uncropped in every social feed (X, Facebook, Reddit, LinkedIn, Instagram).
 * It deliberately contains NO personal information — only a privacy score broken down
 * by area (higher = more privacy-conscious).
 */
const drawShareCard = (
    ctx: CanvasRenderingContext2D,
    data: PaperTrailCardData,
    theme: ShareCardTheme,
    logo?: HTMLImageElement
): void => {
    const cx = CARD_WIDTH / 2;
    const palette = PALETTES[theme];

    // Background gradient.
    const bg = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
    bg.addColorStop(0, palette.bg[0]);
    bg.addColorStop(0.55, palette.bg[1]);
    bg.addColorStop(1, palette.bg[2]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    ctx.fillStyle = palette.title;
    ctx.font = `800 56px ${FONT_STACK}`;
    ctx.fillText('My AI Paper Trail', cx, 80);

    // ---- Hero: score ring (left) + grade & worth callouts (right) ----
    const ringCx = 296;
    const ringCy = 280;
    const ringRadius = 128;
    const startAngle = -Math.PI / 2;
    const fraction = Math.max(0, Math.min(1, data.exposureScore / 100));
    const ringColor = exposureColor(data.exposureScore, theme);

    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(ringCx, ringCy, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = palette.track;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ringCx, ringCy, ringRadius, startAngle, startAngle + fraction * Math.PI * 2);
    ctx.strokeStyle = ringColor;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = palette.title;
    ctx.font = `800 110px ${FONT_STACK}`;
    ctx.fillText(String(data.exposureScore), ringCx, ringCy - 12);
    ctx.font = `600 27px ${FONT_STACK}`;
    ctx.fillStyle = palette.subtle;
    ctx.fillText('OUT OF 100', ringCx, ringCy + 55);
    ctx.textBaseline = 'alphabetic';

    // Right-hand callout cards.
    const cardX = 540;
    const cardW = CARD_WIDTH - MARGIN - cardX;
    const cardH = 116;
    const card1Y = 150;
    const card2Y = card1Y + cardH + 20;

    // Grade card (neutral panel).
    ctx.fillStyle = palette.panel;
    roundRect(ctx, cardX, card1Y, cardW, cardH, 26);
    ctx.fill();
    drawLabel(ctx, 'Exposure grade', cardX + 32, card1Y + 44, palette.panelLabel);
    const gradeText = data.grade.toUpperCase();
    const gradeSize = fitFont(ctx, gradeText, 800, 44, 28, cardW - 64);
    ctx.font = `800 ${gradeSize}px ${FONT_STACK}`;
    ctx.fillStyle = ringColor;
    ctx.textAlign = 'left';
    ctx.fillText(gradeText, cardX + 32, card1Y + 92);

    // Worth card (accent panel — the shareable hook).
    const callout = ctx.createLinearGradient(cardX, card2Y, cardX + cardW, card2Y + cardH);
    callout.addColorStop(0, palette.callout[0]);
    callout.addColorStop(1, palette.callout[1]);
    ctx.fillStyle = palette.panel;
    // ctx.fillStyle = callout;
    roundRect(ctx, cardX, card2Y, cardW, cardH, 26);
    ctx.fill();
    drawLabel(ctx, 'My Data Value', cardX + 32, card2Y + 44, palette.calloutSub);
    ctx.font = `800 56px ${FONT_STACK}`;
    ctx.fillStyle = palette.calloutText;
    ctx.textAlign = 'left';
    ctx.fillText(formatValue(data.estimatedValueUsd), cardX + 32, card2Y + 100);

    // ---- Divider ----
    const dividerY = 450;
    ctx.strokeStyle = palette.divider;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGIN, dividerY);
    ctx.lineTo(CARD_WIDTH - MARGIN, dividerY);
    ctx.stroke();

    // ---- Per-area bars (two columns) ----
    ctx.fillStyle = palette.eyebrow;
    ctx.font = `700 24px ${FONT_STACK}`;
    ctx.textAlign = 'left';
    ctx.fillText('What AI knows about me', MARGIN, dividerY + 48);

    const areas = data.areas.slice(0, 8);
    const half = Math.ceil(areas.length / 2);
    const colGap = 48;
    const colW = (CARD_WIDTH - 2 * MARGIN - colGap) / 2;
    const barHeight = 16;
    const rowGap = 75;
    const firstRowY = dividerY + 106;

    areas.forEach((area, i) => {
        const col = i < half ? 0 : 1;
        const rowIndex = i < half ? i : i - half;
        const colX = MARGIN + col * (colW + colGap);
        const y = firstRowY + rowIndex * rowGap;
        const areaColor = exposureColor(area.exposureScore, theme);

        ctx.font = `600 28px ${FONT_STACK}`;
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

    // ---- Footer CTA ----
    ctx.textAlign = 'center';
    ctx.fillStyle = palette.title;
    ctx.font = `800 36px ${FONT_STACK}`;
    ctx.fillText('Lower is better. How exposed are you?', cx, CARD_HEIGHT - 200);
    ctx.fillStyle = palette.eyebrow;
    ctx.font = `600 30px ${FONT_STACK}`;
    ctx.fillText("What's your AI Paper Trail? · lumo.proton.me/ai-paper-trail", cx, CARD_HEIGHT - 144);

    if (logo) {
        const logoSize = 72;
        ctx.drawImage(logo, cx - logoSize / 2, CARD_HEIGHT - 110, logoSize, logoSize);
    }
};

/** Load the Lumo logo (best-effort) and render the card onto a canvas. */
export const renderShareCard = async (
    canvas: HTMLCanvasElement,
    data: PaperTrailCardData,
    theme: ShareCardTheme
): Promise<void> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }
    let logo: HTMLImageElement | undefined;
    try {
        logo = await loadImage(lumoCatIcon);
    } catch {
        logo = undefined;
    }
    drawShareCard(ctx, data, theme, logo);
};
