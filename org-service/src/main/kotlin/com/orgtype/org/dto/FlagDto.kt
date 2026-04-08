package com.orgtype.org.dto

data class CreateFlagDto(
    val reason: String,
    val note: String? = null
)

data class FlagWithEmployee(
    val id: Long,
    val employeeId: Long,
    val employeeName: String,
    val employeeRole: String,
    val reason: String,
    val note: String?,
    val status: String,
    val createdAt: String
)
