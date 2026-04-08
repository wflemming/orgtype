package com.orgtype.game.dto

data class EmployeeDto(
    val id: Long,
    val legalName: String,
    val preferredName: String? = null,
    val displayName: String,
    val role: String,
    val level: Int,
    val managerId: Long?,
    val imageUrl: String?,
    val linkedinUrl: String?,
    val roleAlias: String? = null
)
