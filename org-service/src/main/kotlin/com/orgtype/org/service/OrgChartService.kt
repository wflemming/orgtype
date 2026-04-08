package com.orgtype.org.service

import com.orgtype.org.dto.EmployeeUpdateDto
import com.orgtype.org.dto.FlagWithEmployee
import com.orgtype.org.dto.OrgChartNode
import com.orgtype.org.model.Employee
import com.orgtype.org.model.EmployeeFlag
import com.orgtype.org.repository.EmployeeFlagRepository
import com.orgtype.org.repository.EmployeeRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class OrgChartService(
    private val employeeRepository: EmployeeRepository,
    private val employeeFlagRepository: EmployeeFlagRepository
) {

    private fun findEmployeeOrNull(id: Long): Employee? =
        employeeRepository.findById(id).orElse(null)

    fun getAllEmployees(sort: String?): List<Employee> {
        return when (sort) {
            "top-down" -> employeeRepository.findAllByOrderByLevelAsc()
            "bottom-up" -> employeeRepository.findAllByOrderByLevelDesc()
            else -> employeeRepository.findAll()
        }
    }

    fun getVisibleEmployees(sort: String?): List<Employee> {
        return when (sort) {
            "top-down" -> employeeRepository.findByHiddenFalseOrderByLevelAsc()
            "bottom-up" -> employeeRepository.findByHiddenFalseOrderByLevelDesc()
            else -> employeeRepository.findByHiddenFalse()
        }
    }

    fun getRandomEmployees(): List<Employee> {
        return employeeRepository.findByHiddenFalse().shuffled()
    }

    fun getEmployee(id: Long): Employee? = findEmployeeOrNull(id)

    @Transactional
    fun importOrgChart(root: OrgChartNode): List<Employee> {
        val imported = mutableListOf<Employee>()
        saveNode(root, managerId = null, level = 1, imported)
        return imported
    }

    private fun saveNode(
        node: OrgChartNode,
        managerId: Long?,
        level: Int,
        accumulator: MutableList<Employee>
    ) {
        val imageUrl = node.imageUrl
            ?: "https://api.dicebear.com/9.x/personas/svg?seed=${node.name.lowercase().replace(" ", "")}"

        val employee = employeeRepository.save(
            Employee(
                legalName = node.name,
                role = node.role,
                level = level,
                managerId = managerId,
                imageUrl = imageUrl,
                linkedinUrl = node.linkedinUrl
            )
        )
        accumulator.add(employee)

        for (report in node.reports) {
            saveNode(report, managerId = employee.id, level = level + 1, accumulator)
        }
    }

    @Transactional
    fun updateEmployee(id: Long, update: EmployeeUpdateDto): Employee? {
        val employee = findEmployeeOrNull(id) ?: return null
        // null = field not sent, keep existing; "" = clear; non-empty = update
        fun resolve(newVal: String?, existing: String?): String? = when {
            newVal == null -> existing
            newVal.isEmpty() -> null
            else -> newVal
        }
        val updated = employee.copy(
            imageUrl = resolve(update.imageUrl, employee.imageUrl),
            linkedinUrl = resolve(update.linkedinUrl, employee.linkedinUrl),
            roleAlias = resolve(update.roleAlias, employee.roleAlias),
            preferredName = resolve(update.preferredName, employee.preferredName)
        )
        return employeeRepository.save(updated)
    }

    fun getOrgChartRoots(): List<Employee> {
        return employeeRepository.findByManagerIdIsNull()
    }

    fun getOrgChartTree(rootId: Long): OrgChartNode? {
        val employee = findEmployeeOrNull(rootId) ?: return null
        return buildTree(employee)
    }

    private fun buildTree(employee: Employee): OrgChartNode {
        val reports = employeeRepository.findByManagerId(employee.id)
        return OrgChartNode(
            id = employee.id,
            name = employee.legalName,
            role = employee.role,
            imageUrl = employee.imageUrl,
            linkedinUrl = employee.linkedinUrl,
            reports = reports.map { buildTree(it) }
        )
    }

    @Transactional
    fun deleteOrgChart(rootId: Long) {
        deleteRecursive(rootId)
    }

    private fun deleteRecursive(employeeId: Long) {
        val reports = employeeRepository.findByManagerId(employeeId)
        for (report in reports) {
            deleteRecursive(report.id)
        }
        deleteFlagsForEmployee(employeeId)
        employeeRepository.deleteById(employeeId)
    }

    private fun deleteFlagsForEmployee(employeeId: Long) {
        employeeFlagRepository.findByEmployeeId(employeeId).forEach {
            employeeFlagRepository.deleteById(it.id)
        }
    }

    // --- Flag operations ---

    @Transactional
    fun createFlag(employeeId: Long, reason: String, note: String?): EmployeeFlag? {
        findEmployeeOrNull(employeeId) ?: return null
        return employeeFlagRepository.save(
            EmployeeFlag(
                employeeId = employeeId,
                reason = reason,
                note = note,
                status = "OPEN",
                createdAt = Instant.now()
            )
        )
    }

    fun getAllFlags(status: String?): List<FlagWithEmployee> {
        val flags = if (status != null) {
            employeeFlagRepository.findByStatus(status)
        } else {
            employeeFlagRepository.findAll()
        }
        val employeeIds = flags.map { it.employeeId }.distinct()
        val employeesById = employeeRepository.findAllById(employeeIds).associateBy { it.id }
        return flags.mapNotNull { flag ->
            val employee = employeesById[flag.employeeId] ?: return@mapNotNull null
            FlagWithEmployee(
                id = flag.id,
                employeeId = employee.id,
                employeeName = employee.displayName,
                employeeRole = employee.role,
                reason = flag.reason,
                note = flag.note,
                status = flag.status,
                createdAt = flag.createdAt.toString()
            )
        }
    }

    @Transactional
    fun resolveFlag(flagId: Long): EmployeeFlag? {
        val flag = employeeFlagRepository.findById(flagId).orElse(null) ?: return null
        return employeeFlagRepository.save(flag.copy(status = "RESOLVED"))
    }

    @Transactional
    fun deleteFlag(flagId: Long) {
        employeeFlagRepository.deleteById(flagId)
    }

    fun findSimilarEmployees(employeeId: Long): List<Employee> {
        val employee = findEmployeeOrNull(employeeId) ?: return emptyList()
        return employeeRepository.findByRole(employee.role).filter { it.id != employeeId }
    }

    @Transactional
    fun setHidden(id: Long, hidden: Boolean): Employee? {
        val employee = findEmployeeOrNull(id) ?: return null
        return employeeRepository.save(employee.copy(hidden = hidden))
    }

    @Transactional
    fun deleteEmployee(id: Long) {
        deleteFlagsForEmployee(id)
        val employee = findEmployeeOrNull(id) ?: return
        val reports = employeeRepository.findByManagerId(id)
        for (report in reports) {
            employeeRepository.save(report.copy(managerId = employee.managerId))
        }
        employeeRepository.deleteById(id)
    }
}
