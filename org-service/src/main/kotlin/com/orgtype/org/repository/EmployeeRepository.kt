package com.orgtype.org.repository

import com.orgtype.org.model.Employee
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EmployeeRepository : JpaRepository<Employee, Long> {
    fun findAllByOrderByLevelAsc(): List<Employee>
    fun findAllByOrderByLevelDesc(): List<Employee>
    fun findByManagerId(managerId: Long): List<Employee>
    fun findByManagerIdIsNull(): List<Employee>
    fun findByHiddenFalseOrderByLevelAsc(): List<Employee>
    fun findByHiddenFalseOrderByLevelDesc(): List<Employee>
    fun findByHiddenFalse(): List<Employee>
    fun findByRole(role: String): List<Employee>
}
