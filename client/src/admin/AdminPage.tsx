import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { JsonUploader } from './JsonUploader'
import { OrgTreePreview } from './OrgTreePreview'
import { FlaggedEmployees } from './FlaggedEmployees'
import {
  importOrgChart,
  getOrgChartRoots,
  getOrgChartTree,
  deleteOrgChart,
} from '../api/orgChart'
import type { OrgChartNode } from '../api/orgChart'
import type { Employee } from '../types/employee'

export function AdminPage() {
  const [preview, setPreview] = useState<OrgChartNode | null>(null)
  const [roots, setRoots] = useState<Employee[]>([])
  const [existingTrees, setExistingTrees] = useState<Map<number, OrgChartNode>>(new Map())
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function loadExisting() {
    try {
      const chartRoots = await getOrgChartRoots()
      setRoots(chartRoots)
      const trees = new Map<number, OrgChartNode>()
      for (const root of chartRoots) {
        const tree = await getOrgChartTree(root.id)
        trees.set(root.id, tree)
      }
      setExistingTrees(trees)
    } catch {
      // org-service might not be running
    }
  }

  useEffect(() => {
    loadExisting()
  }, [])

  async function handleImport() {
    if (!preview) return
    setImporting(true)
    setMessage(null)
    try {
      const employees = await importOrgChart(preview)
      setMessage(`Imported ${employees.length} employees`)
      setPreview(null)
      await loadExisting()
    } catch {
      setMessage('Import failed — is the backend running?')
    } finally {
      setImporting(false)
    }
  }

  async function handleDelete(rootId: number) {
    try {
      await deleteOrgChart(rootId)
      setMessage('Org chart deleted')
      await loadExisting()
    } catch {
      setMessage('Delete failed')
    }
  }

  return (
    <div className="min-h-screen bg-sofi-bg flex flex-col items-center px-4 py-8">
      <header className="mb-10 text-center">
        <Link to="/" className="text-4xl font-bold text-sofi-dark tracking-tight no-underline">
          org<span className="text-sofi-purple">type</span>
        </Link>
        <p className="text-gray-400 mt-2 text-sm">Admin — Manage Org Charts</p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        {/* Import Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-sofi-dark mb-4">Import Org Chart</h2>
          <JsonUploader onParsed={setPreview} />

          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Preview</h3>
              <div className="bg-sofi-bg rounded-xl p-4 max-h-80 overflow-y-auto">
                <OrgTreePreview node={preview} />
              </div>
              <button
                onClick={handleImport}
                disabled={importing}
                className="mt-4 px-6 py-2.5 bg-sofi-purple text-white rounded-xl font-semibold hover:bg-sofi-purple-dark transition-colors disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Import Org Chart'}
              </button>
            </motion.div>
          )}

          {message && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-sm text-sofi-purple font-medium"
            >
              {message}
            </motion.p>
          )}
        </section>

        {/* Existing Org Charts */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-sofi-dark mb-4">
            Current Org Charts ({roots.length})
          </h2>
          {roots.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No org charts yet. Import one above or start the backend to auto-seed.
            </p>
          ) : (
            <div className="space-y-4">
              {roots.map((root) => (
                <div
                  key={root.id}
                  className="bg-sofi-bg rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          root.imageUrl ??
                          `https://api.dicebear.com/9.x/personas/svg?seed=${root.displayName.toLowerCase().replace(/ /g, '')}`
                        }
                        alt={root.displayName}
                        className="w-10 h-10 rounded-full bg-white"
                      />
                      <div>
                        <p className="font-semibold text-sofi-dark">{root.displayName}</p>
                        <p className="text-xs text-gray-400">{root.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(root.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  {existingTrees.has(root.id) && (
                    <div className="max-h-60 overflow-y-auto">
                      <OrgTreePreview node={existingTrees.get(root.id)!} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Flagged Employees */}
        <FlaggedEmployees />

        <div className="text-center">
          <Link
            to="/"
            className="text-sofi-purple hover:text-sofi-purple-dark text-sm font-medium transition-colors"
          >
            ← Back to Game
          </Link>
        </div>
      </main>
    </div>
  )
}
