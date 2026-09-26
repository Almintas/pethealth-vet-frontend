import type { ReactNode } from 'react';

type DashboardSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
  prominent?: boolean;
};

export function DashboardSection({
  id,
  title,
  children,
  prominent = false,
}: DashboardSectionProps) {
  return (
    <section
      className={[
        'dashboard-section',
        prominent ? 'dashboard-section--prominent' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={id}
    >
      <h2 id={id} className="ph-section-title dashboard-section__title">
        {title}
      </h2>
      {children}
    </section>
  );
}
