import { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  AlertOctagon,
  AlertTriangle,
  RotateCcw
} from 'lucide-react'

const PIPELINE_STAGES = [
  { key: 'New', label: 'New Lead', icon: Sparkles, step: 1 },
  { key: 'Contacted', label: 'Contacted', icon: Clock, step: 2 },
  { key: 'Qualified', label: 'Qualified', icon: CheckCircle2, step: 3 },
  { key: 'Converted', label: 'Converted', icon: Award, step: 4 }
]

/**
 * Status Pipeline Bar Component
 * Provides interactive forward/backward stage progression, Converted-revert warning,
 * and Lost-status triggers.
 *
 * @param {object} props
 * @param {string} props.currentStatus
 * @param {(targetStatus: string) => Promise<void>|void} props.onStageClick
 * @param {() => void} props.onMarkLostClick
 * @param {() => void} props.onReopenClick
 * @param {boolean} props.isUpdating
 */
export default function StatusPipelineBar({
  currentStatus,
  onStageClick,
  onMarkLostClick,
  onReopenClick,
  isUpdating = false
}) {
  // Pending stage when user clicks a new stage while Converted
  const [pendingRevertStage, setPendingRevertStage] = useState(null)
  const [showRevertDialog, setShowRevertDialog] = useState(false)

  const isLost = currentStatus === 'Lost'
  const isConverted = currentStatus === 'Converted'

  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.key === currentStatus)

  const handleStageSelect = (targetStageKey) => {
    if (isUpdating || targetStageKey === currentStatus) return

    // If currently Converted, require explicit confirmation before reverting
    if (isConverted) {
      setPendingRevertStage(targetStageKey)
      setShowRevertDialog(true)
      return
    }

    onStageClick(targetStageKey)
  }

  const handleConfirmRevert = () => {
    setShowRevertDialog(false)
    if (pendingRevertStage === 'Lost') {
      onMarkLostClick()
    } else if (pendingRevertStage) {
      onStageClick(pendingRevertStage)
    }
    setPendingRevertStage(null)
  }

  const handleCancelRevert = () => {
    setShowRevertDialog(false)
    setPendingRevertStage(null)
  }

  const handleLostButtonClick = () => {
    if (isUpdating || isLost) return

    if (isConverted) {
      setPendingRevertStage('Lost')
      setShowRevertDialog(true)
      return
    }

    onMarkLostClick()
  }

  return (
    <div className="pipeline-container" aria-label="Lead Status Pipeline">
      <div className="pipeline-bar-wrapper">
        <nav className="pipeline-stepper" aria-label="Progression Steps">
          {PIPELINE_STAGES.map((stage, idx) => {
            const Icon = stage.icon
            const isCurrent = currentStatus === stage.key
            const isCompleted = !isLost && currentStageIndex > idx

            let stepClass = 'pipeline-step'
            if (isCurrent) stepClass += ' pipeline-step-current'
            else if (isCompleted) stepClass += ' pipeline-step-completed'
            else if (isLost) stepClass += ' pipeline-step-inactive'

            return (
              <button
                key={stage.key}
                type="button"
                className={stepClass}
                onClick={() => handleStageSelect(stage.key)}
                disabled={isUpdating}
                aria-current={isCurrent ? 'step' : undefined}
                title={
                  isCurrent
                    ? `Current status: ${stage.label}`
                    : `Move status to ${stage.label}`
                }
              >
                <div className="pipeline-step-badge">
                  {isCompleted ? (
                    <CheckCircle2 size={16} className="step-check-icon" />
                  ) : (
                    <Icon size={16} />
                  )}
                </div>
                <div className="pipeline-step-content">
                  <span className="pipeline-step-num">Step 0{stage.step}</span>
                  <span className="pipeline-step-label">{stage.label}</span>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Lost / Reopen Action Slot */}
        <div className="pipeline-lost-slot">
          {isLost ? (
            <button
              type="button"
              className="btn btn-secondary pipeline-reopen-trigger"
              onClick={onReopenClick}
              disabled={isUpdating}
              title="Reopen lead as Contacted"
            >
              <RotateCcw size={15} />
              <span>Reopen Lead</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary pipeline-lost-trigger"
              onClick={handleLostButtonClick}
              disabled={isUpdating}
              title="Mark lead as Lost with mandatory reason"
            >
              <AlertOctagon size={15} />
              <span>Mark Lost</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Reverting a Converted Lead */}
      {showRevertDialog && (
        <div className="confirm-overlay" role="presentation">
          <div
            className="confirm-box"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="revert-dialog-title"
            aria-describedby="revert-dialog-desc"
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--alert-warning-bg)',
                  color: 'var(--alert-warning-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 id="revert-dialog-title" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                  Revert Converted Lead?
                </h3>
                <p id="revert-dialog-desc" style={{ fontSize: '13.5px', color: 'var(--text-body)', lineHeight: 1.5, margin: 0 }}>
                  This student has already been marked as <strong>Converted (Enrolled)</strong>. Changing their status to <strong>{pendingRevertStage}</strong> will remove their enrolled admission status.
                  <br /><br />
                  Are you sure you want to proceed with this status reversal?
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelRevert}
              >
                Keep Converted
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmRevert}
                style={{
                  backgroundColor: 'var(--alert-warning-text)',
                  borderColor: 'var(--alert-warning-text)',
                  color: '#ffffff'
                }}
              >
                Yes, Revert to {pendingRevertStage}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
