package com.orgtype.org.model

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "employee_flags")
data class EmployeeFlag(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "employee_id", nullable = false)
    val employeeId: Long = 0,

    @Column(nullable = false)
    val reason: String = "",

    @Column(columnDefinition = "TEXT")
    val note: String? = null,

    @Column(nullable = false)
    val status: String = "OPEN",

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)
