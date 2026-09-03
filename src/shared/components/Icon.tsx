import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import type { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

const FAMILY_PREFIX: Record<string, IconPrefix> = {
  'fa-solid': 'fas',
  'fa-regular': 'far',
  'fa-brands': 'fab',
};

// Font Awesome CSS modifier classes (as opposed to an actual icon name) that
// can appear alongside an icon token, e.g. "fa-solid fa-spinner fa-spin".
// Kept as CSS classes on the rendered <svg> rather than parsed as the icon.
const MODIFIER_TOKENS = new Set([
  'spin',
  'spin-pulse',
  'spin-reverse',
  'pulse',
  'beat',
  'fade',
  'bounce',
  'shake',
  'fw',
  'border',
  'inverse',
  'flip-horizontal',
  'flip-vertical',
  'flip-both',
  'xs',
  'sm',
  'lg',
  'xl',
  '2xl',
  '1x',
  '2x',
  '3x',
  '4x',
  '5x',
  '6x',
  '7x',
  '8x',
  '9x',
  '10x',
]);

interface IconProps {
  className: string;
  style?: FontAwesomeIconProps['style'];
  title?: string;
}

/**
 * Drop-in replacement for `<i className="fa-solid fa-chevron-down">` —
 * renders a real React-owned inline SVG via @fortawesome/react-fontawesome
 * instead of a CSS webfont or a DOM-mutating auto-replace script. Both of
 * those broke on this app's Power Platform host once pushed: webfonts get
 * blocked/corrupted by the host's CSP (font-src 'self'), and the DOM-mutating
 * "SVG+JS" build crashed the app with `NotFoundError: Failed to execute
 * 'removeChild' on 'Node'` whenever a dynamic list (e.g. the proof-files
 * drawer) re-rendered a subtree it had already mutated outside React.
 *
 * Parses the exact same class-string convention every call site already
 * uses ("fa-solid fa-chevron-down", optionally with a modifier like
 * "fa-spin" or an extra non-fa CSS class mixed in), so no call site needed
 * its icon name touched — only the tag name `<i` was mechanically renamed.
 */
export function Icon({ className, style, title }: IconProps) {
  const tokens = className.split(/\s+/).filter(Boolean);
  let prefix: IconPrefix = 'fas';
  let iconName: IconName | null = null;
  const extraClasses: string[] = [];

  for (const token of tokens) {
    if (token in FAMILY_PREFIX) {
      prefix = FAMILY_PREFIX[token];
      continue;
    }
    if (!token.startsWith('fa-')) {
      extraClasses.push(token);
      continue;
    }
    const rest = token.slice(3);
    if (MODIFIER_TOKENS.has(rest)) {
      extraClasses.push(token);
      continue;
    }
    iconName = rest as IconName;
  }

  if (!iconName) return null;

  return (
    <FontAwesomeIcon
      icon={[prefix, iconName]}
      className={extraClasses.length ? extraClasses.join(' ') : undefined}
      spin={tokens.includes('fa-spin')}
      style={style}
      title={title}
    />
  );
}
