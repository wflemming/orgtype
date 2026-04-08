package com.orgtype.org.service

import com.orgtype.org.dto.EmployeeUpdateDto
import com.orgtype.org.dto.OrgChartNode
import com.orgtype.org.model.Employee
import com.orgtype.org.model.EmployeeFlag
import com.orgtype.org.repository.EmployeeFlagRepository
import com.orgtype.org.repository.EmployeeRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.junit.jupiter.MockitoExtension
import java.time.Instant
import java.util.*

@ExtendWith(MockitoExtension::class)
class OrgChartServiceTest {

    @Mock
    private lateinit var employeeRepository: EmployeeRepository

    @Mock
    private lateinit var employeeFlagRepository: EmployeeFlagRepository

    private lateinit var service: OrgChartService

    @BeforeEach
    fun setUp() {
        service = OrgChartService(employeeRepository, employeeFlagRepository)
    }

    private fun employee(
        id: Long = 1,
        name: String = "Jane Doe",
        role: String = "Engineer",
        level: Int = 1,
        managerId: Long? = null,
        hidden: Boolean = false
    ) = Employee(
        id = id,
        legalName = name,
        role = role,
        level = level,
        managerId = managerId,
        hidden = hidden
    )

    @Nested
    inner class GetAllEmployees {
        @Test
        fun `returns all employees with no sort`() {
            val employees = listOf(employee(1), employee(2, "Bob"))
            `when`(employeeRepository.findAll()).thenReturn(employees)

            val result = service.getAllEmployees(null)
            assertEquals(2, result.size)
            verify(employeeRepository).findAll()
        }

        @Test
        fun `returns employees sorted top-down`() {
            `when`(employeeRepository.findAllByOrderByLevelAsc()).thenReturn(emptyList())
            service.getAllEmployees("top-down")
            verify(employeeRepository).findAllByOrderByLevelAsc()
        }

        @Test
        fun `returns employees sorted bottom-up`() {
            `when`(employeeRepository.findAllByOrderByLevelDesc()).thenReturn(emptyList())
            service.getAllEmployees("bottom-up")
            verify(employeeRepository).findAllByOrderByLevelDesc()
        }
    }

    @Nested
    inner class GetVisibleEmployees {
        @Test
        fun `filters hidden employees`() {
            `when`(employeeRepository.findByHiddenFalse()).thenReturn(listOf(employee()))
            val result = service.getVisibleEmployees(null)
            assertEquals(1, result.size)
            verify(employeeRepository).findByHiddenFalse()
        }

        @Test
        fun `sorts visible employees top-down`() {
            `when`(employeeRepository.findByHiddenFalseOrderByLevelAsc()).thenReturn(emptyList())
            service.getVisibleEmployees("top-down")
            verify(employeeRepository).findByHiddenFalseOrderByLevelAsc()
        }
    }

    @Nested
    inner class GetRandomEmployees {
        @Test
        fun `returns shuffled visible employees`() {
            val employees = (1..10L).map { employee(it, "Emp$it") }
            `when`(employeeRepository.findByHiddenFalse()).thenReturn(employees)
            val result = service.getRandomEmployees()
            assertEquals(10, result.size)
        }
    }

    @Nested
    inner class ImportOrgChart {
        @Test
        fun `imports a flat org chart`() {
            val node = OrgChartNode(name = "CEO", role = "Chief Executive")
            `when`(employeeRepository.save(any(Employee::class.java)))
                .thenAnswer { inv ->
                    val emp = inv.getArgument<Employee>(0)
                    emp.copy(id = 1)
                }

            val result = service.importOrgChart(node)
            assertEquals(1, result.size)
            assertEquals("CEO", result[0].legalName)
        }

        @Test
        fun `imports nested org chart with correct levels`() {
            var nextId = 1L
            `when`(employeeRepository.save(any(Employee::class.java)))
                .thenAnswer { inv ->
                    val emp = inv.getArgument<Employee>(0)
                    emp.copy(id = nextId++)
                }

            val node = OrgChartNode(
                name = "CEO",
                role = "Chief Executive",
                reports = listOf(
                    OrgChartNode(name = "VP Eng", role = "VP", reports = listOf(
                        OrgChartNode(name = "Dev", role = "Engineer")
                    )),
                    OrgChartNode(name = "VP Sales", role = "VP")
                )
            )

            val result = service.importOrgChart(node)
            assertEquals(4, result.size)
            verify(employeeRepository, times(4)).save(any(Employee::class.java))
        }
    }

    @Nested
    inner class UpdateEmployee {
        @Test
        fun `updates existing employee fields`() {
            val existing = employee(1, "Jane")
            `when`(employeeRepository.findById(1L)).thenReturn(Optional.of(existing))
            `when`(employeeRepository.save(any(Employee::class.java)))
                .thenAnswer { it.getArgument<Employee>(0) }

            val result = service.updateEmployee(1L, EmployeeUpdateDto(roleAlias = "SWE"))
            assertNotNull(result)
            assertEquals("SWE", result!!.roleAlias)
        }

        @Test
        fun `returns null for nonexistent employee`() {
            `when`(employeeRepository.findById(99L)).thenReturn(Optional.empty())
            val result = service.updateEmployee(99L, EmployeeUpdateDto(roleAlias = "X"))
            assertNull(result)
        }

        @Test
        fun `empty string clears field`() {
            val existing = employee(1).copy(roleAlias = "Old Alias")
            `when`(employeeRepository.findById(1L)).thenReturn(Optional.of(existing))
            `when`(employeeRepository.save(any(Employee::class.java)))
                .thenAnswer { it.getArgument<Employee>(0) }

            val result = service.updateEmployee(1L, EmployeeUpdateDto(roleAlias = ""))
            assertNull(result!!.roleAlias)
        }

        @Test
        fun `null field preserves existing value`() {
            val existing = employee(1).copy(roleAlias = "Keep Me")
            `when`(employeeRepository.findById(1L)).thenReturn(Optional.of(existing))
            `when`(employeeRepository.save(any(Employee::class.java)))
                .thenAnswer { it.getArgument<Employee>(0) }

            val result = service.updateEmployee(1L, EmployeeUpdateDto(roleAlias = null))
            assertEquals("Keep Me", result!!.roleAlias)
        }
    }

    @Nested
    inner class OrgChartTreeOperations {
        @Test
        fun `getOrgChartRoots returns employees with no manager`() {
            `when`(employeeRepository.findByManagerIdIsNull()).thenReturn(listOf(employee()))
            val roots = service.getOrgChartRoots()
            assertEquals(1, roots.size)
        }

        @Test
        fun `getOrgChartTree builds recursive tree`() {
            val ceo = employee(1, "CEO", "Chief Executive")
            val vp = employee(2, "VP", "VP Engineering", managerId = 1)

            `when`(employeeRepository.findById(1L)).thenReturn(Optional.of(ceo))
            `when`(employeeRepository.findByManagerId(1L)).thenReturn(listOf(vp))
            `when`(employeeRepository.findByManagerId(2L)).thenReturn(emptyList())

            val tree = service.getOrgChartTree(1L)
            assertNotNull(tree)
            assertEquals("CEO", tree!!.name)
            assertEquals(1, tree.reports.size)
            assertEquals("VP", tree.reports[0].name)
        }

        @Test
        fun `getOrgChartTree returns null for nonexistent root`() {
            `when`(employeeRepository.findById(99L)).thenReturn(Optional.empty())
            assertNull(service.getOrgChartTree(99L))
        }
    }

    @Nested
    inner class FlagOperations {
        @Test
        fun `creates flag for existing employee`() {
            `when`(employeeRepository.findById(1L)).thenReturn(Optional.of(employee()))
            `when`(employeeFlagRepository.save(any(EmployeeFlag::class.java)))
                .thenAnswer { inv ->
                    val flag = inv.getArgument<EmployeeFlag>(0)
                    flag.copy(id = 10)
                }

            val flag = service.createFlag(1L, "wrong_role", "Not accurate")
            assertNotNull(flag)
            assertEquals("wrong_role", flag!!.reason)
            assertEquals("OPEN", flag.status)
        }

        @Test
        fun `returns null when creating flag for nonexistent employee`() {
            `when`(employeeRepository.findById(99L)).thenReturn(Optional.empty())
            assertNull(service.createFlag(99L, "wrong_role", null))
        }

        @Test
        fun `resolves existing flag`() {
            val flag = EmployeeFlag(id = 1, employeeId = 1, reason = "wrong_role", status = "OPEN", createdAt = Instant.now())
            `when`(employeeFlagRepository.findById(1L)).thenReturn(Optional.of(flag))
            `when`(employeeFlagRepository.save(any(EmployeeFlag::class.java)))
                .thenAnswer { it.getArgument<EmployeeFlag>(0) }

            val resolved = service.resolveFlag(1L)
            assertNotNull(resolved)
            assertEquals("RESOLVED", resolved!!.status)
        }

        @Test
        fun `resolveFlag returns null for nonexistent flag`() {
            `when`(employeeFlagRepository.findById(99L)).thenReturn(Optional.empty())
            assertNull(service.resolveFlag(99L))
        }

        @Test
        fun `getAllFlags filters by status`() {
            val flag = EmployeeFlag(id = 1, employeeId = 1, reason = "wrong_role", status = "OPEN", createdAt = Instant.now())
            `when`(employeeFlagRepository.findByStatus("OPEN")).thenReturn(listOf(flag))
            `when`(employeeRepository.findAllById(listOf(1L))).thenReturn(listOf(employee()))

            val result = service.getAllFlags("OPEN")
            assertEquals(1, result.size)
            assertEquals("OPEN", result[0].status)
        }
    }

    @Nested
    inner class SetHidden {
        @Test
        fun `hides an employee`() {
            val emp = employee(1, hidden = false)
            `when`(employeeRepository.findById(1L)).thenReturn(Optional.of(emp))
            `when`(employeeRepository.save(any(Employee::class.java)))
                .thenAnswer { it.getArgument<Employee>(0) }

            val result = service.setHidden(1L, true)
            assertTrue(result!!.hidden)
        }

        @Test
        fun `returns null for nonexistent employee`() {
            `when`(employeeRepository.findById(99L)).thenReturn(Optional.empty())
            assertNull(service.setHidden(99L, true))
        }
    }

    @Nested
    inner class FindSimilarEmployees {
        @Test
        fun `finds employees with same role excluding self`() {
            val emp = employee(1, "Alice", "Engineer")
            val similar = employee(2, "Bob", "Engineer")
            `when`(employeeRepository.findById(1L)).thenReturn(Optional.of(emp))
            `when`(employeeRepository.findByRole("Engineer")).thenReturn(listOf(emp, similar))

            val result = service.findSimilarEmployees(1L)
            assertEquals(1, result.size)
            assertEquals("Bob", result[0].legalName)
        }

        @Test
        fun `returns empty for nonexistent employee`() {
            `when`(employeeRepository.findById(99L)).thenReturn(Optional.empty())
            assertTrue(service.findSimilarEmployees(99L).isEmpty())
        }
    }

    @Nested
    inner class DeleteEmployee {
        @Test
        fun `re-parents reports when deleting a manager`() {
            val manager = employee(1, "Manager", managerId = null)
            val report1 = employee(2, "Report1", managerId = 1)
            val report2 = employee(3, "Report2", managerId = 1)

            `when`(employeeFlagRepository.findByEmployeeId(1L)).thenReturn(emptyList())
            `when`(employeeRepository.findById(1L)).thenReturn(Optional.of(manager))
            `when`(employeeRepository.findByManagerId(1L)).thenReturn(listOf(report1, report2))
            `when`(employeeRepository.save(any(Employee::class.java)))
                .thenAnswer { it.getArgument<Employee>(0) }

            service.deleteEmployee(1L)

            // Should re-parent both reports to null (manager's managerId)
            verify(employeeRepository, times(2)).save(any(Employee::class.java))
            verify(employeeRepository).deleteById(1L)
        }
    }

    @Nested
    inner class EmployeeModel {
        @Test
        fun `displayName returns preferredName when set`() {
            val emp = Employee(legalName = "Robert", preferredName = "Bob")
            assertEquals("Bob", emp.displayName)
        }

        @Test
        fun `displayName returns legalName when no preferredName`() {
            val emp = Employee(legalName = "Robert", preferredName = null)
            assertEquals("Robert", emp.displayName)
        }
    }
}
