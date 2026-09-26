import { useTranslation } from 'react-i18next';

type MedicationsPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
};

function buildPageNumbers(current: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  return sorted;
}

export function MedicationsPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: MedicationsPaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const pageNumbers = buildPageNumbers(page, totalPages);

  return (
    <nav className="medical-history-pagination" aria-label={t('medications.paginationLabel')}>
      <p className="medical-history-pagination__summary">
        {t('medications.showingRange', { start, end, total })}
      </p>
      <div className="medical-history-pagination__controls">
        <button
          type="button"
          className="ph-button ph-button--secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t('medications.previous')}
        </button>
        <div className="medical-history-pagination__pages">
          {pageNumbers.map((pageNumber, index) => {
            const previous = pageNumbers[index - 1];
            const showEllipsis = previous !== undefined && pageNumber - previous > 1;
            return (
              <span key={pageNumber} className="medical-history-pagination__page-group">
                {showEllipsis ? (
                  <span className="medical-history-pagination__ellipsis" aria-hidden="true">
                    …
                  </span>
                ) : null}
                <button
                  type="button"
                  className={[
                    'medical-history-pagination__page',
                    pageNumber === page ? 'medical-history-pagination__page--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={pageNumber === page ? 'page' : undefined}
                  onClick={() => onPageChange(pageNumber)}
                >
                  {pageNumber}
                </button>
              </span>
            );
          })}
        </div>
        <button
          type="button"
          className="ph-button ph-button--secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('medications.next')}
        </button>
      </div>
    </nav>
  );
}
