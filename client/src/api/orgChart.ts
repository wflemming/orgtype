import axios from 'axios'
import type { Employee } from '../types/employee'

export interface OrgChartNode {
  name: string
  role: string
  imageUrl?: string
  linkedinUrl?: string
  reports: OrgChartNode[]
}

const api = axios.create({ baseURL: '/api/org' })

export async function importOrgChart(root: OrgChartNode): Promise<Employee[]> {
  const { data } = await api.post<Employee[]>('/charts', root)
  return data
}

export async function getOrgChartRoots(): Promise<Employee[]> {
  const { data } = await api.get<Employee[]>('/charts')
  return data
}

export async function getOrgChartTree(rootId: number): Promise<OrgChartNode> {
  const { data } = await api.get<OrgChartNode>(`/charts/${rootId}`)
  return data
}

export async function deleteOrgChart(rootId: number): Promise<void> {
  await api.delete(`/charts/${rootId}`)
}

export async function updateEmployee(
  id: number,
  update: { imageUrl?: string; linkedinUrl?: string; roleAlias?: string }
): Promise<Employee> {
  const { data } = await api.patch<Employee>(`/employees/${id}`, update)
  return data
}
