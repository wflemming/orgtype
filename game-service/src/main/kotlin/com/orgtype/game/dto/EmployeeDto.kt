package com.orgtype.game.dto

data class EmployeeDto(
    val id: Long,
    val name: String,
    val role: String,
    val level: Int,
    val managerId: Long?,
    val imageUrl: String?,
    val linkedinUrl: String?
)
