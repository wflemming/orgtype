package com.orgtype.org.dto

data class OrgChartNode(
    val name: String,
    val role: String,
    val imageUrl: String? = null,
    val linkedinUrl: String? = null,
    val reports: List<OrgChartNode> = emptyList()
)
