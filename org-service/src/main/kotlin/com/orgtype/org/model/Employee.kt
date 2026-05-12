package com.orgtype.org.model

import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.persistence.*

@Entity
@Table(name = "employees")
data class Employee(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "legal_name", nullable = false)
    val legalName: String = "",

    @Column(name = "preferred_name")
    val preferredName: String? = null,

    @Column(nullable = false)
    val role: String = "",

    @Column(nullable = false)
    val level: Int = 1,

    @Column(name = "manager_id")
    val managerId: Long? = null,

    @Column(name = "image_url", length = 2048)
    val imageUrl: String? = null,

    @Column(name = "linkedin_url", length = 2048)
    val linkedinUrl: String? = null,

    @Column(name = "role_alias")
    val roleAlias: String? = null,

    @Column(nullable = false)
    val hidden: Boolean = false
) {
    @get:JsonProperty("displayName")
    val displayName: String
        get() = preferredName ?: legalName
}
