package com.orgtype.game.service

import com.orgtype.game.client.OrgServiceClient
import com.orgtype.game.dto.EmployeeDto
import org.springframework.stereotype.Service

@Service
class GameService(private val orgServiceClient: OrgServiceClient) {

    fun getEmployees(sort: String?): List<EmployeeDto> {
        return orgServiceClient.getEmployees(sort)
    }

    fun getRandomEmployees(): List<EmployeeDto> {
        return orgServiceClient.getRandomEmployees()
    }
}
