export default function TableSkeleton({ rowCount = 5, mode = 'table' }) {
  const rows = Array.from({ length: rowCount }, (_, i) => i)

  if (mode === 'cards') {
    return (
      <div className="skeleton-cards-container">
        {rows.map((idx) => (
          <div key={idx} className="skeleton-card">
            <div className="skeleton-card-top">
              <div className="skeleton-line" style={{ width: '50%', height: '18px' }} />
              <div className="skeleton-line" style={{ width: '70px', height: '22px', borderRadius: '12px' }} />
            </div>
            <div className="skeleton-line" style={{ width: '75%', height: '14px', margin: '10px 0' }} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <div className="skeleton-line" style={{ width: '45%', height: '13px' }} />
              <div className="skeleton-line" style={{ width: '35%', height: '13px' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {rows.map((idx) => (
        <tr key={idx} className="skeleton-table-row">
          <td style={{ padding: '16px 20px' }}>
            <div className="skeleton-line" style={{ width: '130px', height: '16px', marginBottom: '6px' }} />
            <div className="skeleton-line" style={{ width: '70px', height: '12px' }} />
          </td>
          <td style={{ padding: '16px 20px' }}>
            <div className="skeleton-line" style={{ width: '110px', height: '14px', marginBottom: '4px' }} />
            <div className="skeleton-line" style={{ width: '140px', height: '12px' }} />
          </td>
          <td style={{ padding: '16px 20px' }}>
            <div className="skeleton-line" style={{ width: '150px', height: '14px', marginBottom: '4px' }} />
            <div className="skeleton-line" style={{ width: '80px', height: '12px' }} />
          </td>
          <td style={{ padding: '16px 20px' }}>
            <div className="skeleton-line" style={{ width: '100px', height: '22px', borderRadius: '12px' }} />
          </td>
          <td style={{ padding: '16px 20px' }}>
            <div className="skeleton-line" style={{ width: '65px', height: '22px', borderRadius: '12px' }} />
          </td>
          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
            <div className="skeleton-line" style={{ width: '70px', height: '28px', borderRadius: '6px', marginLeft: 'auto' }} />
          </td>
        </tr>
      ))}
    </>
  )
}
