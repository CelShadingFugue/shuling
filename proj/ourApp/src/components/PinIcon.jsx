/** VSCode 风格的图钉：未锁定是描边，锁定是实心。 */
export default function PinIcon({ on = false, size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill={on ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={on ? 0.8 : 1.15}
      strokeLinejoin="round"
      strokeLinecap="round"
      style={{ display: 'block' }}
    >
      <path d="M10.3 1.7 14.3 5.7 12 6.6 11.4 9.7 6.3 4.6 9.4 4Z" />
      <path d="M6.5 9.6 2.9 13.2" fill="none" />
    </svg>
  )
}
