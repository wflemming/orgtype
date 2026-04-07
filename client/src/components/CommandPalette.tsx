import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Action {
  key: string
  label: string
  shortcut: string
  onAction: () => void
}

interface Props {
  actions: Action[]
}

export function CommandPalette({ actions }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const handleAction = useCallback(
    (action: Action) => {
      setIsOpen(false)
      action.onAction()
    },
    []
  )

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K or Ctrl+K to toggle palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        return
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        return
      }

      // Global shortcuts (when palette is closed)
      if (!isOpen) {
        for (const action of actions) {
          const parts = action.shortcut.split('+')
          const key = parts[parts.length - 1].toLowerCase()
          const needsMeta = parts.includes('Cmd') || parts.includes('Ctrl')
          const needsShift = parts.includes('Shift')

          if (
            e.key.toLowerCase() === key &&
            (!needsMeta || e.metaKey || e.ctrlKey) &&
            (!needsShift || e.shiftKey)
          ) {
            // Don't intercept plain letter keys — those are for typing
            if (needsMeta || needsShift) {
              e.preventDefault()
              action.onAction()
              return
            }
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, actions])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Commands
              </p>
            </div>
            <div className="p-2">
              {actions.map((action) => (
                <button
                  key={action.key}
                  onClick={() => handleAction(action)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-sofi-bg transition-colors text-left"
                >
                  <span className="text-sm font-medium text-sofi-dark">
                    {action.label}
                  </span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-500 font-mono">
                    {action.shortcut}
                  </kbd>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-300 text-center">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-400 font-mono">Esc</kbd> to close
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
