import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Employee, FlagReason } from '../types/employee'
import { FLAG_REASON_LABELS } from '../types/employee'
import { createFlag } from '../api/orgChart'

interface Props {
  employee: Employee
  isOpen: boolean
  onClose: () => void
}

const REASONS = Object.keys(FLAG_REASON_LABELS) as FlagReason[]

export function FlagModal({ employee, isOpen, onClose }: Props) {
  const [reason, setReason] = useState<FlagReason | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function reset() {
    setReason(null)
    setNote('')
    setSubmitting(false)
    setSubmitted(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!reason) return
    setSubmitting(true)
    try {
      await createFlag(employee.id, reason, note || undefined)
      setSubmitted(true)
      setTimeout(handleClose, 1200)
    } catch (err) {
      console.error('Failed to flag employee:', err)
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4"
          >
            {submitted ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">&#x2713;</div>
                <p className="text-sofi-dark font-semibold">Flag submitted</p>
                <p className="text-gray-400 text-sm mt-1">
                  {employee.displayName} has been flagged for review.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-sofi-dark">
                    Flag {employee.displayName}
                  </h3>
                  <button
                    onClick={handleClose}
                    className="text-gray-300 hover:text-gray-500 transition-colors text-xl leading-none"
                  >
                    &times;
                  </button>
                </div>

                <p className="text-gray-400 text-sm mb-4">
                  Something off about this person? Flag it for admin review.
                </p>

                <div className="space-y-2 mb-4">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                        reason === r
                          ? 'bg-sofi-purple/10 border-sofi-purple text-sofi-purple'
                          : 'bg-gray-50 border-gray-100 text-sofi-dark hover:bg-gray-100'
                      }`}
                    >
                      {FLAG_REASON_LABELS[r]}
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <label className="text-xs text-gray-400 block mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Any additional context..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sofi-purple/30 focus:border-sofi-purple resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={!reason || submitting}
                    className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Flag'}
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
