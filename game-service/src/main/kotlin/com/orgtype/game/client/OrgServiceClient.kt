package com.orgtype.game.client

import com.orgtype.game.dto.EmployeeDto
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.ParameterizedTypeReference
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient

@Component
class OrgServiceClient(
    @Value("\${org-service.url}") private val orgServiceUrl: String
) {
    private val restClient = RestClient.builder()
        .baseUrl(orgServiceUrl)
        .build()

    fun getEmployees(sort: String?): List<EmployeeDto> {
        val uri = if (sort != null) "/api/org/employees/visible?sort=$sort" else "/api/org/employees/visible"
        return restClient.get()
            .uri(uri)
            .retrieve()
            .body(object : ParameterizedTypeReference<List<EmployeeDto>>() {})
            ?: emptyList()
    }

    fun getRandomEmployees(): List<EmployeeDto> {
        return restClient.get()
            .uri("/api/org/employees/random")
            .retrieve()
            .body(object : ParameterizedTypeReference<List<EmployeeDto>>() {})
            ?: emptyList()
    }
}
