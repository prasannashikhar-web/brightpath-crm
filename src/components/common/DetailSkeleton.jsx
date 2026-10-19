/**
 * Shimmer skeleton loading placeholder for the Lead Detail page.
 * Prevents layout shift (CLS) during lead data resolution.
 */
export default function DetailSkeleton() {
  return (
    <div className="detail-skeleton-container" aria-label="Loading lead details" aria-busy="true">
      {/* Top back button skeleton */}
      <div style={{ marginBottom: '18px' }}>
        <div className="skeleton-line" style={{ width: '160px', height: '34px', borderRadius: 'var(--radius-sm)' }} />
      </div>

      {/* Header skeleton */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div className="skeleton-line" style={{ width: '220px', height: '28px', borderRadius: 'var(--radius-sm)' }} />
              <div className="skeleton-line" style={{ width: '90px', height: '24px', borderRadius: 'var(--radius-full)' }} />
            </div>
            <div className="skeleton-line" style={{ width: '180px', height: '16px', borderRadius: '4px' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="skeleton-line" style={{ width: '130px', height: '36px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton-line" style={{ width: '160px', height: '36px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        </div>
      </div>

      {/* Pipeline bar skeleton */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div className="skeleton-line" style={{ width: '100%', height: '52px', borderRadius: 'var(--radius-md)' }} />
      </div>

      {/* 2-column info grid skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div className="skeleton-line" style={{ width: '180px', height: '20px', marginBottom: '20px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton-line" style={{ width: '85%', height: '16px' }} />
            <div className="skeleton-line" style={{ width: '70%', height: '16px' }} />
            <div className="skeleton-line" style={{ width: '90%', height: '16px' }} />
            <div className="skeleton-line" style={{ width: '60%', height: '16px' }} />
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div className="skeleton-line" style={{ width: '180px', height: '20px', marginBottom: '20px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton-line" style={{ width: '75%', height: '16px' }} />
            <div className="skeleton-line" style={{ width: '80%', height: '16px' }} />
            <div className="skeleton-line" style={{ width: '65%', height: '16px' }} />
            <div className="skeleton-line" style={{ width: '70%', height: '16px' }} />
          </div>
        </div>
      </div>

      {/* Bottom tabs skeleton */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="skeleton-line" style={{ width: '260px', height: '22px', marginBottom: '16px' }} />
        <div className="skeleton-line" style={{ width: '100%', height: '60px', borderRadius: 'var(--radius-sm)' }} />
      </div>
    </div>
  )
}
