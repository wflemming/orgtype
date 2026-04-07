import { useState, useRef } from 'react'
import type { OrgChartNode } from '../api/orgChart'

interface Props {
  onParsed: (node: OrgChartNode) => void
}

export function JsonUploader({ onParsed }: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function tryParse(json: string) {
    setText(json)
    setError(null)
    try {
      const parsed = JSON.parse(json) as OrgChartNode
      if (!parsed.name || !parsed.role) {
        setError('JSON must have "name" and "role" fields at the root')
        return
      }
      onParsed(parsed)
    } catch {
      setError('Invalid JSON')
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      tryParse(content)
    }
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      tryParse(content)
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-sofi-purple transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-gray-400 text-sm">
          Drop a .json file here or click to upload
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => tryParse(e.target.value)}
          placeholder='Paste org chart JSON here... (see sample-org-chart.json)'
          className="w-full h-64 p-4 border border-gray-200 rounded-xl font-mono text-sm resize-none focus:outline-none focus:border-sofi-purple transition-colors"
        />
        {error && (
          <p className="absolute bottom-2 left-4 text-red-500 text-xs">{error}</p>
        )}
      </div>
    </div>
  )
}
