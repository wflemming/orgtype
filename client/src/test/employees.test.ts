import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()

vi.mock('axios', () => ({
  default: {
    create: () => ({
      get: mockGet,
    }),
  },
}))

// Import after mock setup
const { fetchEmployees } = await import('../api/employees')

const mockEmployees = [
  { id: 1, legalName: 'Alice', displayName: 'Alice', role: 'Engineer', level: 2, managerId: null, imageUrl: null, linkedinUrl: null, roleAlias: null, preferredName: null },
  { id: 2, legalName: 'Bob', displayName: 'Bob', role: 'Designer', level: 2, managerId: null, imageUrl: null, linkedinUrl: null, roleAlias: null, preferredName: null },
]

describe('fetchEmployees', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches random employees from /employees/random', async () => {
    mockGet.mockResolvedValue({ data: mockEmployees })

    const result = await fetchEmployees('random')
    expect(mockGet).toHaveBeenCalledWith('/employees/random')
    expect(result).toEqual(mockEmployees)
  })

  it('fetches top-down employees with sort param', async () => {
    mockGet.mockResolvedValue({ data: mockEmployees })

    const result = await fetchEmployees('top-down')
    expect(mockGet).toHaveBeenCalledWith('/employees', { params: { sort: 'top-down' } })
    expect(result).toEqual(mockEmployees)
  })

  it('fetches bottom-up employees with sort param', async () => {
    mockGet.mockResolvedValue({ data: mockEmployees })

    await fetchEmployees('bottom-up')
    expect(mockGet).toHaveBeenCalledWith('/employees', { params: { sort: 'bottom-up' } })
  })
})
