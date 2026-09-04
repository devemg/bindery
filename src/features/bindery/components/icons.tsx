/**
 * Phosphor glyphs, inlined on their 256 viewBox and stroked with
 * `currentColor` so the colour comes from a token on the element.
 * @see https://phosphoricons.com
 */

interface IconProps {
  readonly size: number;
  readonly className?: string;
}

function Icon({ size, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export function UploadFileIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g strokeWidth="14">
        <path d="M32 200V56a8 8 0 018-8h56l24 24h72a8 8 0 018 8v120a8 8 0 01-8 8H40a8 8 0 01-8-8z" />
        <path d="M128 168v-56M104 136l24-24 24 24" />
      </g>
    </Icon>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g strokeWidth="14">
        <rect x="32" y="48" width="192" height="160" rx="8" />
        <path d="M32 168l52-44 60 52M160 148l24-20 40 34" />
        <circle cx="164" cy="100" r="12" />
      </g>
    </Icon>
  );
}

export function WarningCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g strokeWidth="16">
        <circle cx="128" cy="128" r="96" />
        <path d="M128 80v64" />
        <path d="M128 176h0" />
      </g>
    </Icon>
  );
}
