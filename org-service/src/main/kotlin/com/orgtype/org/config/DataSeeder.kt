package com.orgtype.org.config

import com.orgtype.org.dto.OrgChartNode
import com.orgtype.org.repository.EmployeeRepository
import com.orgtype.org.service.OrgChartService
import org.springframework.boot.CommandLineRunner
import org.springframework.stereotype.Component

@Component
class DataSeeder(
    private val employeeRepository: EmployeeRepository,
    private val orgChartService: OrgChartService
) : CommandLineRunner {

    override fun run(vararg args: String?) {
        if (employeeRepository.count() > 0) return

        val sampleOrg = OrgChartNode(
            name = "Alexandra Chen",
            role = "Chief Executive Officer",
            linkedinUrl = "https://linkedin.com/in/example",
            reports = listOf(
                OrgChartNode(
                    name = "Marcus Rivera",
                    role = "VP of Engineering",
                    reports = listOf(
                        OrgChartNode(
                            name = "James Okafor",
                            role = "Director of Backend Engineering",
                            reports = listOf(
                                OrgChartNode(name = "Olivia Thompson", role = "Senior Backend Engineer")
                            )
                        ),
                        OrgChartNode(
                            name = "Sofia Martinez",
                            role = "Director of Frontend Engineering",
                            reports = listOf(
                                OrgChartNode(name = "Liam Nguyen", role = "Frontend Engineer")
                            )
                        )
                    )
                ),
                OrgChartNode(
                    name = "Priya Sharma",
                    role = "VP of Product",
                    reports = listOf(
                        OrgChartNode(
                            name = "David Kim",
                            role = "Director of Product Design",
                            reports = listOf(
                                OrgChartNode(name = "Noah Patel", role = "UX Designer")
                            )
                        ),
                        OrgChartNode(name = "Emma Johansson", role = "Senior Product Manager")
                    )
                )
            )
        )

        val imported = orgChartService.importOrgChart(sampleOrg)
        println("Seeded ${imported.size} employees via org chart import")
    }
}
