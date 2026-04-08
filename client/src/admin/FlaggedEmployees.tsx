import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Employee, EmployeeFlag } from '../types/employee'
import { FLAG_REASON_LABELS, type FlagReason } from '../types/employee'
import {
  getFlags,
  resolveFlag,
  deleteFlag,
  hideEmployee,
  removeEmployee,
  findSimilarEmployees,
} from '../api/orgChart'

export function FlaggedEmployees() {
  const [flags, setFlags] = useState<EmployeeFlag[]>([])
  const [filter, setFilter] = useState<'OPEN' | 'RESOLVED' | 'ALL'>('OPEN')
  const [expandedFlag, setExpandedFlag] = useState<number | null>(null)
  const [similarResults, setSimilarResults] = useState<Map<number, Employee[]>>(
    new Map()
  )
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  async function loadFlags() {
    try {
      const status = filter === 'ALL' ? undefined : filter
      const data = await getFlags(status)
      setFlags(data)
    } catch {
      // backend may not be running
    }
  }

  useEffect(() => {
    loadFlags()
  }, [filter])

  async function handleReconcile(flag: EmployeeFlag) {
    setExpandedFlag(expandedFlag === flag.id ? null : flag.id)
    if (!similarResults.has(flag.employeeId)) {
      try {
        const similar = await findSimilarEmployees(flag.employeeId)
        setSimilarResults((prev) => new Map(prev).set(flag.employeeId, similar))
      } catch {
        setSimilarResults((prev) => new Map(prev).set(flag.employeeId, []))
      }
    }
  }

  async function withMessage(message: string, action: () => Promise<void>) {
    await action()
    setActionMessage(message)
    await loadFlags()
    setTimeout(() => setActionMessage(null), 2000)
  }

  const handleResolve = (flagId: number) =>
    withMessage('Flag resolved', () => resolveFlag(flagId))

  const handleDismiss = (flagId: number) =>
    withMessage('Flag dismissed', () => deleteFlag(flagId))

  const handleHide = (flag: EmployeeFlag) =>
    withMessage(`${flag.employeeName} hidden from game`, async () => {
      await hideEmployee(flag.employeeId)
      await resolveFlag(flag.id)
    })

  async function handleRemove(flag: EmployeeFlag) {
    if (!confirm(`Remove ${flag.employeeName}? Their reports will be reassigned to their manager.`)) return
    await withMessage(`${flag.employeeName} removed`, () => removeEmployee(flag.employeeId))
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-sofi-dark">
          Flagged Employees ({flags.length})
        </h2>
        <div className="flex gap-1">
          {(['OPEN', 'RESOLVED', 'ALL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                filter === f
                  ? 'bg-sofi-purple text-white'
                  : 'bg-gray-50 text-gray-400 hover:text-sofi-purple'
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {actionMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-sofi-purple font-medium mb-3"
          >
            {actionMessage}
          </motion.p>
        )}
      </AnimatePresence>

      {flags.length === 0 ? (
        <p className="text-gray-400 text-sm">No flagged employees.</p>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="bg-sofi-bg rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sofi-dark">
                      {flag.employeeName}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        flag.status === 'OPEN'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {flag.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{flag.employeeRole}</p>
                  <p className="text-sm text-sofi-dark mt-1">
                    {FLAG_REASON_LABELS[flag.reason as FlagReason] ?? flag.reason}
                  </p>
                  {flag.note && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                      "{flag.note}"
                    </p>
                  )}
                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(flag.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {flag.status === 'OPEN' && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleReconcile(flag)}
                      className="px-2.5 py-1.5 text-xs bg-sofi-purple/10 text-sofi-purple rounded-lg hover:bg-sofi-purple/20 transition-colors font-medium"
                    >
                      Reconcile
                    </button>
                    <button
                      onClick={() => handleHide(flag)}
                      className="px-2.5 py-1.5 text-xs bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors font-medium"
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => handleRemove(flag)}
                      className="px-2.5 py-1.5 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors font-medium"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => handleDismiss(flag.id)}
                      className="px-2.5 py-1.5 text-xs bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {flag.status === 'RESOLVED' && (
                  <button
                    onClick={() => handleDismiss(flag.id)}
                    className="px-2.5 py-1.5 text-xs bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>

              {/* Reconcile panel */}
              <AnimatePresence>
                {expandedFlag === flag.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 mb-2">
                        People with same role: {flag.employeeRole}
                      </p>
                      {similarResults.get(flag.employeeId)?.length === 0 ? (
                        <p className="text-xs text-gray-400">
                          No other employees with this role.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {similarResults.get(flag.employeeId)?.map((emp) => (
                            <div
                              key={emp.id}
                              className="flex items-center justify-between bg-white rounded-lg px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-sofi-dark">
                                  {emp.displayName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {emp.role}
                                  {emp.hidden && (
                                    <span className="ml-1 text-amber-500">(hidden)</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleResolve(flag.id)}
                        className="mt-2 px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium"
                      >
                        Mark as Resolved
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
