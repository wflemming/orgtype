package com.orgtype.org.service

import com.orgtype.org.dto.OrgChartNode
import com.orgtype.org.model.Employee
import com.orgtype.org.repository.EmployeeRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class OrgChartService(private val employeeRepository: EmployeeRepository) {

    fun getAllEmployees(sort: String?): List<Employee> {
        return when (sort) {
            "top-down" -> employeeRepository.findAllByOrderByLevelAsc()
            "bottom-up" -> employeeRepository.findAllByOrderByLevelDesc()
            else -> employeeRepository.findAll()
        }
    }

    fun getRandomEmployees(): List<Employee> {
        return employeeRepository.findAll().shuffled()
    }

    fun getEmployee(id: Long): Employee? {
        return employeeRepository.findById(id).orElse(null)
    }

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
                name = node.name,
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
    fun updateEmployee(id: Long, imageUrl: String?, linkedinUrl: String?, roleAlias: String?): Employee? {
        val employee = employeeRepository.findById(id).orElse(null) ?: return null
        val updated = employee.copy(
            imageUrl = imageUrl ?: employee.imageUrl,
            linkedinUrl = linkedinUrl ?: employee.linkedinUrl,
            roleAlias = roleAlias ?: employee.roleAlias
        )
        return employeeRepository.save(updated)
    }

    fun getOrgChartRoots(): List<Employee> {
        return employeeRepository.findByManagerIdIsNull()
    }

    fun getOrgChartTree(rootId: Long): OrgChartNode? {
        val employee = employeeRepository.findById(rootId).orElse(null) ?: return null
        return buildTree(employee)
    }

    private fun buildTree(employee: Employee): OrgChartNode {
        val reports = employeeRepository.findByManagerId(employee.id)
        return OrgChartNode(
            name = employee.name,
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
        employeeRepository.deleteById(employeeId)
    }
}
