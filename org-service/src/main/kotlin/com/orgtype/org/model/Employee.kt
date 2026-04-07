package com.orgtype.org.model

import jakarta.persistence.*

@Entity
@Table(name = "employees")
data class Employee(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    val name: String = "",

    @Column(nullable = false)
    val role: String = "",

    @Column(nullable = false)
    val level: Int = 1,

    @Column(name = "manager_id")
    val managerId: Long? = null,

    @Column(name = "image_url")
    val imageUrl: String? = null,

    @Column(name = "linkedin_url")
    val linkedinUrl: String? = null
)
