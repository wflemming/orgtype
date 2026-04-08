import axios from 'axios'
import type { Employee, EmployeeFlag } from '../types/employee'

export interface OrgChartNode {
  id?: number
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
  update: { imageUrl?: string; linkedinUrl?: string; roleAlias?: string; preferredName?: string }
): Promise<Employee> {
  const { data } = await api.patch<Employee>(`/employees/${id}`, update)
  return data
}

export async function createFlag(
  employeeId: number,
  reason: string,
  note?: string
): Promise<void> {
  await api.post(`/employees/${employeeId}/flags`, { reason, note })
}

export async function getFlags(status?: string): Promise<EmployeeFlag[]> {
  const params = status ? { status } : {}
  const { data } = await api.get<EmployeeFlag[]>('/flags', { params })
  return data
}

export async function resolveFlag(flagId: number): Promise<void> {
  await api.patch(`/flags/${flagId}/resolve`)
}

export async function deleteFlag(flagId: number): Promise<void> {
  await api.delete(`/flags/${flagId}`)
}

export async function hideEmployee(id: number): Promise<Employee> {
  const { data } = await api.patch<Employee>(`/employees/${id}/hide`)
  return data
}

export async function unhideEmployee(id: number): Promise<Employee> {
  const { data } = await api.patch<Employee>(`/employees/${id}/unhide`)
  return data
}

export async function removeEmployee(id: number): Promise<void> {
  await api.delete(`/employees/${id}`)
}

export async function findSimilarEmployees(id: number): Promise<Employee[]> {
  const { data } = await api.get<Employee[]>(`/employees/${id}/similar`)
  return data
}
