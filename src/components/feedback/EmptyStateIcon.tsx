import catPawMark from '../../assets/paw-soft.svg';

export function EmptyStateIcon() {
  return (
    <img
      className="ph-empty-state__icon"
      src={catPawMark}
      alt=""
      aria-hidden="true"
      width={40}
      height={40}
    />
  );
}
