export function BerryLogo({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <ellipse cx="32" cy="38" rx="20" ry="18" fill="#C72654" />
      <ellipse cx="22" cy="34" rx="7" ry="6" fill="#E23B6A" opacity="0.9" />
      <ellipse cx="34" cy="30" rx="6.5" ry="5.5" fill="#E23B6A" opacity="0.85" />
      <ellipse cx="42" cy="36" rx="6" ry="5.5" fill="#A81D45" />
      <ellipse cx="28" cy="44" rx="6" ry="5" fill="#A81D45" opacity="0.9" />
      <ellipse cx="38" cy="45" rx="5.5" ry="4.5" fill="#8E1638" />
      <path
        d="M32 22c2-6 8-10 14-10-2 5-7 8-14 10Z"
        fill="#3D6B4F"
      />
      <path
        d="M32 22c-1.5-5 1-11 7-14-4 4-6 9-7 14Z"
        fill="#2F523C"
      />
      <circle cx="24" cy="36" r="1.2" fill="#FFE5EC" opacity="0.7" />
      <circle cx="36" cy="33" r="1" fill="#FFE5EC" opacity="0.55" />
      <circle cx="40" cy="42" r="1.1" fill="#FFE5EC" opacity="0.45" />
    </svg>
  );
}
