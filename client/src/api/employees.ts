import axios from 'axios'
import type { Employee, GameMode } from '../types/employee'

const api = axios.create({ baseURL: '/api/game' })

export async function fetchEmployees(mode: GameMode): Promise<Employee[]> {
  if (mode === 'random') {
    const { data } = await api.get<Employee[]>('/employees/random')
    return data
  }
  const { data } = await api.get<Employee[]>('/employees', {
    params: { sort: mode },
  })
  return data
}
