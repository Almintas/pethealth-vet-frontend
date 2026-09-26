import catPawMark from '../../assets/pethealth-cat-paw-from-reference.svg';

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
