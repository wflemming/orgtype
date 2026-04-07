import { motion, AnimatePresence } from 'framer-motion'
import type { Employee } from '../types/employee'

interface Props {
  employee: Employee
  isRevealed: boolean
}

const levelBadge: Record<number, string> = {
  1: 'C-Suite',
  2: 'VP',
  3: 'Director',
  4: 'IC',
}

export function EmployeeCard({ employee, isRevealed }: Props) {
  const avatarUrl =
    employee.imageUrl ??
    `https://api.dicebear.com/9.x/personas/svg?seed=${employee.name}`

  return (
    <div className="relative w-72 h-96" style={{ perspective: '1000px' }}>
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.div
            key="front"
            initial={{ rotateY: 0, opacity: 0, x: -50 }}
            animate={{ rotateY: 0, opacity: 1, x: 0 }}
            exit={{ rotateY: 90 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center p-6 backface-hidden"
          >
            <img
              src={avatarUrl}
              alt="Who is this?"
              className="w-32 h-32 rounded-full bg-sofi-bg object-cover mb-6"
            />
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-sofi-purple/10 text-sofi-purple mb-3">
              {levelBadge[employee.level] ?? `Level ${employee.level}`}
            </span>
            <p className="text-sofi-dark font-medium text-center text-sm leading-snug">
              {employee.role}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute inset-0 bg-sofi-purple rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 text-white backface-hidden"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-5xl mb-4"
            >
              ✓
            </motion.div>
            <img
              src={avatarUrl}
              alt={employee.name}
              className="w-24 h-24 rounded-full bg-white/20 object-cover mb-4"
            />
            <h3 className="text-xl font-bold mb-1">{employee.name}</h3>
            <p className="text-white/80 text-sm mb-4">{employee.role}</p>
            {employee.linkedinUrl && (
              <a
                href={employee.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 underline text-sm hover:text-white transition-colors"
              >
                LinkedIn Profile →
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
