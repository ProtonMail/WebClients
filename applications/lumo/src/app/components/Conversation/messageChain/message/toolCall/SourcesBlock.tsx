import isNil from 'lodash/isNil';
import uniq from 'lodash/uniq';
import tinycolor from 'tinycolor2';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components';

import type { SearchItem } from '../../../../../lib/toolCall/types';
import { getDomain } from './helpers';
import { useSourceFavIcon } from './useSourceFavIcon';

import './Sources.scss';

export type SourcesBlockProps = {
    results: SearchItem[] | null;
    onClick: () => void;
};

export const SourceFavIcon = ({ domain }: { domain: string }) => {
    const { src } = useSourceFavIcon(domain);
    if (!src) {
        if (domain) {
            return <ColoredDisk domain={domain} />;
        } else {
            return <Icon name="globe" className="color-norm" size={4} />;
        }
    }

    return <img src={src} alt="" className="rounded-full shrink-0 w-6" />;
};

export const SourcesButton = ({ results, onClick }: SourcesBlockProps) => {
    if (!results) {
        return null;
    }

    const domains = results.map(getDomain).filter((domain) => !isNil(domain));
    const uniqueDomains = uniq(domains);
    const firstThreeDomains = uniqueDomains.slice(0, 3);

    return (
        <Button
            className="lumo-no-copy flex flex-row flex-nowrap gap-2 items-center shrink-0 p-2 rounded"
            shape="outline"
            onClick={onClick}
        >
            <div className="flex flex-row flex-nowrap">
                {firstThreeDomains.map((domain) => (
                    <div key={domain} className="source-favicon rounded-full bg-norm border border-weak flex">
                        <SourceFavIcon domain={domain} />
                    </div>
                ))}
            </div>
            <span className="">{c('collider_2025: Web Search').t`Sources`}</span>
        </Button>
    );
};

export const ColoredDisk = ({ domain }: { domain: string }) => {
    const colorHexString = getColorFromDomain(domain);
    const letter = (domain[0] || ' ').toUpperCase();
    return (
        <svg width="1.25rem" height="1.25rem" viewBox="0 0 100 100">
            <circle cx="50%" cy="50%" r="48" fill={colorHexString} />
            <text
                x="50%"
                y="57%"
                fontSize="60"
                fontFamily="'Arial', sans-serif"
                alignmentBaseline="middle"
                textAnchor="middle"
                fill="#ffffff"
            >
                {letter}
            </text>
        </svg>
    );
};

// Function to compute a hash from a string
function computeStringHash(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;

    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        // Bitwise operations to mix bits thoroughly
        hash = ((hash << 5) - hash + charCode) | 0;
    }
    return Math.abs(hash); // Ensure non-negative result
}

// Generate a color based on a domain name
function getColorFromDomain(domainName: string): string {
    // Default saturation and luminosity
    const DEFAULT_SATURATION = 0.75;
    const DEFAULT_LUMINOSITY = 0.25;

    // Get the hash of the domain name
    const hashValue = computeStringHash(domainName);

    // Calculate hue based on hash
    const MAX_HUE = 360; // Full range of hues
    const hue = hashValue % MAX_HUE;

    // Construct the HSL Color Object
    const hslObj = { h: hue, s: DEFAULT_SATURATION, l: DEFAULT_LUMINOSITY };

    // Convert HSL to HEX using TinyColor
    const tinyCol = tinycolor(hslObj);
    return tinyCol.toHexString();
}
