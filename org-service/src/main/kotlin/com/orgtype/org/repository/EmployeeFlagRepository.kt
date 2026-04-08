package com.orgtype.org.repository

import com.orgtype.org.model.EmployeeFlag
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EmployeeFlagRepository : JpaRepository<EmployeeFlag, Long> {
    fun findByStatus(status: String): List<EmployeeFlag>
    fun findByEmployeeId(employeeId: Long): List<EmployeeFlag>
}
