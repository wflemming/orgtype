import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Employee } from '../types/employee'
import { LEVEL_LABELS } from '../types/employee'
import { updateEmployee } from '../api/orgChart'

interface Props {
  employee: Employee
  isRevealed: boolean
  onEmployeeUpdated?: (updated: Employee) => void
  onFlag?: () => void
}

export function EmployeeCard({ employee, isRevealed, onEmployeeUpdated, onFlag }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [roleAlias, setRoleAlias] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {}
    // Empty string is valid (means "clear the field")
    if (roleAlias && roleAlias.length > 50) {
      errs.roleAlias = 'Must be 50 characters or fewer'
    }
    if (imageUrl && !/^https?:\/\/.+/.test(imageUrl)) {
      errs.imageUrl = 'Must be a valid URL starting with http(s)://'
    }
    if (linkedinUrl && !/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/.test(linkedinUrl)) {
      errs.linkedinUrl = 'Must be a LinkedIn profile URL'
    }
    return errs
  }

  // Reset editing state when employee changes
  useEffect(() => {
    setIsEditing(false)
    setSaving(false)
    setImageUrl('')
    setLinkedinUrl('')
    setRoleAlias('')
    setPreferredName('')
  }, [employee.id])

  const avatarUrl =
    employee.imageUrl ??
    `https://api.dicebear.com/9.x/personas/svg?seed=${employee.displayName}`

  function openEditor() {
    setPreferredName(employee.preferredName ?? '')
    setImageUrl(employee.imageUrl ?? '')
    setLinkedinUrl(employee.linkedinUrl ?? '')
    setRoleAlias(employee.roleAlias ?? '')
    setErrors({})
    setIsEditing(true)
  }

  async function handleSave() {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      // Send the field value as-is: non-empty = update, empty = clear
      // Only omit (undefined) if the value hasn't changed from the original
      const updated = await updateEmployee(employee.id, {
        preferredName: preferredName !== (employee.preferredName ?? '') ? preferredName : undefined,
        imageUrl: imageUrl !== (employee.imageUrl ?? '') ? imageUrl : undefined,
        linkedinUrl: linkedinUrl !== (employee.linkedinUrl ?? '') ? linkedinUrl : undefined,
        roleAlias: roleAlias !== (employee.roleAlias ?? '') ? roleAlias : undefined,
      })
      onEmployeeUpdated?.(updated)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save employee:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`relative w-72 ${isEditing ? 'min-h-96' : 'h-96'}`} style={{ perspective: '1000px' }}>
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
            <div className="relative">
              <img
                src={avatarUrl}
                alt="Who is this?"
                className="w-32 h-32 rounded-full bg-sofi-bg object-cover mb-6"
              />
              {employee.linkedinUrl && (
                <a
                  href={employee.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 right-0 w-7 h-7 bg-[#0A66C2] rounded-full flex items-center justify-center shadow-md hover:bg-[#004182] transition-colors"
                  title="LinkedIn"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-sofi-purple/10 text-sofi-purple mb-3">
              {LEVEL_LABELS[employee.level] ?? `Level ${employee.level}`}
            </span>
            {employee.roleAlias ? (
              <div className="text-center">
                <p className="text-sofi-dark font-bold text-lg">{employee.roleAlias}</p>
                <p className="text-gray-400 text-xs mt-1">{employee.role}</p>
              </div>
            ) : (
              <p className="text-sofi-dark font-medium text-center text-sm leading-snug">
                {employee.role}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className={`absolute inset-x-0 top-0 ${isEditing ? 'relative' : 'bottom-0'} bg-sofi-purple rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 text-white backface-hidden`}
          >
            {!isEditing ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="text-5xl mb-3"
                >
                  ✓
                </motion.div>
                <img
                  src={avatarUrl}
                  alt={employee.displayName}
                  className="w-20 h-20 rounded-full bg-white/20 object-cover mb-3"
                />
                <h3 className="text-xl font-bold mb-1">{employee.displayName}</h3>
                {employee.roleAlias ? (
                  <div className="text-center mb-2">
                    <p className="text-white font-bold text-sm">{employee.roleAlias}</p>
                    <p className="text-white/70 text-xs">{employee.role}</p>
                  </div>
                ) : (
                  <p className="text-white/80 text-sm mb-2">{employee.role}</p>
                )}
                {employee.linkedinUrl && (
                  <a
                    href={employee.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/90 underline text-sm hover:text-white transition-colors mb-2"
                  >
                    LinkedIn Profile →
                  </a>
                )}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={openEditor}
                    className="px-3 py-1 text-xs bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    Edit Info
                  </button>
                  {onFlag && (
                    <button
                      onClick={onFlag}
                      className="px-3 py-1 text-xs bg-amber-500/30 rounded-lg hover:bg-amber-500/50 transition-colors"
                    >
                      Flag
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2.5 w-full" onClick={(e) => e.stopPropagation()}>
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Edit {employee.displayName}
                </p>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Preferred Name</label>
                  <input
                    type="text"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    maxLength={100}
                    placeholder={employee.legalName}
                    className="w-full px-3 py-2 rounded-lg text-sm text-sofi-dark bg-white/90 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <p className="text-white/40 text-xs mt-0.5">Legal: {employee.legalName}</p>
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Role Alias</label>
                  <input
                    type="text"
                    value={roleAlias}
                    onChange={(e) => { setRoleAlias(e.target.value); setErrors((p) => ({ ...p, roleAlias: '' })) }}
                    maxLength={50}
                    placeholder="e.g. CLO, CFO, VP Eng..."
                    className={`w-full px-3 py-2 rounded-lg text-sm text-sofi-dark bg-white/90 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${errors.roleAlias ? 'ring-2 ring-red-400' : 'focus:ring-white/50'}`}
                  />
                  {errors.roleAlias && <p className="text-red-300 text-xs mt-0.5">{errors.roleAlias}</p>}
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Photo URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => { setImageUrl(e.target.value); setErrors((p) => ({ ...p, imageUrl: '' })) }}
                    placeholder="https://..."
                    className={`w-full px-3 py-2 rounded-lg text-sm text-sofi-dark bg-white/90 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${errors.imageUrl ? 'ring-2 ring-red-400' : 'focus:ring-white/50'}`}
                  />
                  {errors.imageUrl && <p className="text-red-300 text-xs mt-0.5">{errors.imageUrl}</p>}
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => { setLinkedinUrl(e.target.value); setErrors((p) => ({ ...p, linkedinUrl: '' })) }}
                    placeholder="https://linkedin.com/in/..."
                    className={`w-full px-3 py-2 rounded-lg text-sm text-sofi-dark bg-white/90 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${errors.linkedinUrl ? 'ring-2 ring-red-400' : 'focus:ring-white/50'}`}
                  />
                  {errors.linkedinUrl && <p className="text-red-300 text-xs mt-0.5">{errors.linkedinUrl}</p>}
                </div>
                {imageUrl && imageUrl !== employee.imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-full bg-white/20 object-cover mx-auto"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-3 py-2 text-sm bg-white text-sofi-purple rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 text-sm bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
