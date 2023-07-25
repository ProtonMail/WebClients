import { forwardRef } from 'react';

import { isFirefoxLessThan55 } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

export type IconSize =
    | 6
    | 8
    | 10
    | 11
    | 12
    | 14
    | 16
    | 18
    | 20
    | 22
    | 24
    | 28
    | 32
    | 36
    | 40
    | 42
    | 48
    | 56
    | 60
    | 70
    | 100
    | 110;

export type IconName =
    | 'alias'
    | 'app-switch'
    | 'archive-box'
    | 'arrow-down'
    | 'arrow-down-arrow-up'
    | 'arrow-down-circle'
    | 'arrow-down-circle-filled'
    | 'arrow-down-line'
    | 'arrow-down-to-square'
    | 'arrow-in-to-rectangle'
    | 'arrow-left'
    | 'arrow-left-and-up'
    | 'arrow-out-from-rectangle'
    | 'arrow-out-square'
    | 'arrow-over-square'
    | 'arrow-right'
    | 'arrow-right-arrow-left'
    | 'arrow-rotate-right'
    | 'arrow-up'
    | 'arrow-up-and-left'
    | 'arrow-up-and-left-big'
    | 'arrow-up-and-right-big'
    | 'arrow-up-big-line'
    | 'arrow-up-bounce-left'
    | 'arrow-up-from-square'
    | 'arrow-up-line'
    | 'arrows-cross'
    | 'arrows-from-center'
    | 'arrows-left-right'
    | 'arrows-rotate'
    | 'arrows-swap-right'
    | 'arrows-switch'
    | 'arrows-to-center'
    | 'arrows-up-and-left'
    | 'arrows-up-and-left-big'
    | 'at'
    | 'backspace'
    | 'bag-percent'
    | 'bell'
    | 'bolt'
    | 'bookmark'
    | 'brand-amex'
    | 'brand-android'
    | 'brand-apple'
    | 'brand-bitcoin'
    | 'brand-brave'
    | 'brand-chrome'
    | 'brand-discover'
    | 'brand-edge'
    | 'brand-firefox'
    | 'brand-github'
    | 'brand-linux'
    | 'brand-mac'
    | 'brand-mastercard'
    | 'brand-paypal'
    | 'brand-proton'
    | 'brand-proton-calendar'
    | 'brand-proton-drive'
    | 'brand-proton-mail'
    | 'brand-proton-mail-filled'
    | 'brand-proton-mail-filled-plus'
    | 'brand-proton-vpn'
    | 'brand-reddit'
    | 'brand-simple-login'
    | 'brand-tor'
    | 'brand-twitter'
    | 'brand-visa'
    | 'brand-windows'
    | 'brand-wireguard'
    | 'briefcase'
    | 'broom'
    | 'bug'
    | 'buildings'
    | 'calendar-cells'
    | 'calendar-checkmark'
    | 'calendar-grid'
    | 'calendar-row'
    | 'calendar-today'
    | 'camera'
    | 'card-identity'
    | 'checkmark'
    | 'checkmark-circle'
    | 'checkmark-circle-filled'
    | 'checkmark-triple'
    | 'chevron-down'
    | 'chevron-down-filled'
    | 'chevron-left'
    | 'chevron-left-filled'
    | 'chevron-right'
    | 'chevron-right-filled'
    | 'chevron-up'
    | 'chevron-up-filled'
    | 'chevrons-left'
    | 'chevrons-right'
    | 'circle'
    | 'circle-filled'
    | 'circle-half-filled'
    | 'circle-slash'
    | 'clock'
    | 'clock-paper-plane'
    | 'clock-rotate-left'
    | 'cloud'
    | 'code'
    | 'cog-wheel'
    | 'credit-card'
    | 'credit-card-detailed'
    | 'cross'
    | 'cross-big'
    | 'cross-circle'
    | 'cross-circle-filled'
    | 'cross-small'
    | 'drive'
    | 'earth'
    | 'emoji'
    | 'envelope'
    | 'envelope-arrow-up-and-right'
    | 'envelope-cross'
    | 'envelope-dot'
    | 'envelope-lock'
    | 'envelope-magnifying-glass'
    | 'envelope-open'
    | 'envelope-open-text'
    | 'envelopes'
    | 'emoji'
    | 'eraser'
    | 'exclamation-circle'
    | 'exclamation-circle-filled'
    | 'exclamation-triangle-filled'
    | 'eye'
    | 'eye-slash'
    | 'file'
    | 'file-arrow-in'
    | 'file-arrow-in-up'
    | 'file-arrow-out'
    | 'file-image'
    | 'file-lines'
    | 'file-pdf'
    | 'file-shapes'
    | 'filing-cabinet'
    | 'filter'
    | 'fingerprint'
    | 'fire'
    | 'fire-slash'
    | 'folder'
    | 'folder-arrow-in'
    | 'folder-arrow-in-filled'
    | 'folder-arrow-up'
    | 'folder-filled'
    | 'folder-open'
    | 'folder-open-filled'
    | 'folder-plus'
    | 'folders'
    | 'folders-filled'
    | 'gift'
    | 'globe'
    | 'grid-2'
    | 'grid-3'
    | 'hamburger'
    | 'heart'
    | 'hook'
    | 'hourglass'
    | 'house'
    | 'house-filled'
    | 'image'
    | 'inbox'
    | 'info-circle'
    | 'info-circle-filled'
    | 'key'
    | 'key-history'
    | 'key-skeleton'
    | 'language'
    | 'life-ring'
    | 'lightbulb'
    | 'lines-long-to-small'
    | 'lines-vertical'
    | 'link'
    | 'link-pen'
    | 'link-slash'
    | 'list-bullets'
    | 'list-numbers'
    | 'lock'
    | 'lock-check-filled'
    | 'lock-exclamation-filled'
    | 'lock-filled'
    | 'lock-open-check-filled'
    | 'lock-open-exclamation-filled'
    | 'lock-open-pen-filled'
    | 'lock-pen-filled'
    | 'locks'
    | 'low-dash'
    | 'magnifier'
    | 'mailbox'
    | 'map'
    | 'map-pin'
    | 'minus'
    | 'minus-circle'
    | 'mobile'
    | 'mobile-plus'
    | 'money-bills'
    | 'moon'
    | 'note'
    | 'notepad-checklist'
    | 'pass-all-vaults'
    | 'pass-atom'
    | 'pass-basketball'
    | 'pass-bear'
    | 'pass-book'
    | 'pass-bookmark'
    | 'pass-box'
    | 'pass-cheque'
    | 'pass-circles'
    | 'pass-cream'
    | 'pass-credit-card'
    | 'pass-fire'
    | 'pass-fish'
    | 'pass-flower'
    | 'pass-gift'
    | 'pass-group'
    | 'pass-heart'
    | 'pass-home'
    | 'pass-json'
    | 'pass-laptop'
    | 'pass-leaf'
    | 'pass-lock'
    | 'pass-mushroom'
    | 'pass-pacman'
    | 'pass-shield'
    | 'pass-shop'
    | 'pass-shopping-cart'
    | 'pass-smile'
    | 'pass-star'
    | 'pass-trash'
    | 'pass-vault'
    | 'pass-wallet'
    | 'pass-work'
    | 'paint-roller'
    | 'palette'
    | 'paper-clip'
    | 'paper-clip-vertical'
    | 'paper-plane'
    | 'paper-plane-horizontal'
    | 'pause'
    | 'pen'
    | 'pen-square'
    | 'pencil'
    | 'phone'
    | 'play'
    | 'plus'
    | 'plus-circle'
    | 'plus-circle-filled'
    | 'power-off'
    | 'presentation-screen'
    | 'printer'
    | 'question-circle'
    | 'question-circle-filled'
    | 'robot'
    | 'rocket'
    | 'servers'
    | 'shield'
    | 'shield-2'
    | 'shield-2-check-filled'
    | 'shield-filled'
    | 'shield-half-filled'
    | 'speech-bubble'
    | 'squares'
    | 'squares-in-square'
    | 'star'
    | 'star-filled'
    | 'star-slash'
    | 'storage'
    | 'sun'
    | 'switch-off'
    | 'switch-on'
    | 'switch-on-lock'
    | 'tag'
    | 'tag-filled'
    | 'tag-plus'
    | 'tags'
    | 'text-align-center'
    | 'text-align-justify'
    | 'text-align-left'
    | 'text-align-right'
    | 'text-bold'
    | 'text-italic'
    | 'text-quote'
    | 'text-underline'
    | 'three-dots-horizontal'
    | 'three-dots-vertical'
    | 'trash'
    | 'trash-clock'
    | 'trash-cross'
    | 'trash-cross-filled'
    | 'tv'
    | 'upgrade'
    | 'user'
    | 'user-arrow-left'
    | 'user-arrow-right'
    | 'user-circle'
    | 'user-filled'
    | 'user-plus'
    | 'users'
    | 'users-filled'
    | 'users-merge'
    | 'users-plus'
    | 'vault'
    | 'wallet'
    | 'window-image'
    | 'window-terminal'
    | 'wrench';

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
    /** Determines which icon to render based on its name */
    name: IconName;
    /** If specified, renders an sr-only element for screenreaders */
    alt?: string;
    /** If specified, renders an inline title element */
    title?: string;
    /** The size of the icon */
    size?: IconSize;
    /** How many degrees the icon should be rotated */
    rotate?: number;
    /** Applied as inline css 'color' attribute on the svg element */
    color?: string;
    /** Icon name prefix */
    nameSpaceSvg?: string;
}

const Icon = forwardRef<SVGSVGElement, IconProps>(
    ({ name, alt, title, color, className = '', viewBox = '0 0 16 16', size = 16, rotate = 0, ...rest }, ref) => {
        const style = {
            ...(color && { color }),
            ...(rotate && { transform: `rotate(${rotate}deg)` }),
        };

        // Patch broken SVG lookup for Firefox < 55.
        const href = isFirefoxLessThan55() ? window.location.href.replace(window.location.hash, '') : '';

        return (
            <>
                <svg
                    style={style}
                    viewBox={viewBox}
                    className={clsx([`icon-${size}p`, className])}
                    role="img"
                    focusable="false"
                    ref={ref}
                    aria-hidden="true"
                    {...rest}
                >
                    {title ? <title>{title}</title> : null}
                    <use xlinkHref={`${href}#ic-${name}`} />
                </svg>
                {alt ? <span className="sr-only">{alt}</span> : null}
            </>
        );
    }
);

export default Icon;
