import type { OrgChartNode } from '../api/orgChart'

interface Props {
  node: OrgChartNode
  depth?: number
}

export function OrgTreePreview({ node, depth = 0 }: Props) {
  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-sofi-purple/20 pl-4' : ''}>
      <div className="flex items-center gap-3 py-2">
        <img
          src={
            node.imageUrl ??
            `https://api.dicebear.com/9.x/personas/svg?seed=${node.name.toLowerCase().replace(/ /g, '')}`
          }
          alt={node.name}
          className="w-8 h-8 rounded-full bg-sofi-bg"
        />
        <div>
          <p className="text-sm font-semibold text-sofi-dark">{node.name}</p>
          <p className="text-xs text-gray-400">{node.role}</p>
        </div>
      </div>
      {node.reports?.map((report, i) => (
        <OrgTreePreview key={i} node={report} depth={depth + 1} />
      ))}
    </div>
  )
}
