package com.orgtype.org.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.orgtype.org.dto.EmployeeUpdateDto
import com.orgtype.org.dto.OrgChartNode
import com.orgtype.org.model.Employee
import com.orgtype.org.model.EmployeeFlag
import com.orgtype.org.service.OrgChartService
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.Instant

@WebMvcTest(OrgChartController::class)
class OrgChartControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockitoBean
    private lateinit var orgChartService: OrgChartService

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    private fun employee(
        id: Long = 1,
        name: String = "Jane Doe",
        role: String = "Engineer"
    ) = Employee(id = id, legalName = name, role = role)

    @Nested
    inner class EmployeeEndpoints {
        @Test
        fun `GET employees returns list`() {
            `when`(orgChartService.getAllEmployees(null))
                .thenReturn(listOf(employee()))

            mockMvc.perform(get("/api/org/employees"))
                .andExpect(status().isOk)
                .andExpect(jsonPath("$[0].legalName").value("Jane Doe"))
        }

        @Test
        fun `GET employees with sort param`() {
            `when`(orgChartService.getAllEmployees("top-down"))
                .thenReturn(listOf(employee()))

            mockMvc.perform(get("/api/org/employees?sort=top-down"))
                .andExpect(status().isOk)
        }

        @Test
        fun `GET employee by id returns 200`() {
            `when`(orgChartService.getEmployee(1L)).thenReturn(employee())

            mockMvc.perform(get("/api/org/employees/1"))
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.legalName").value("Jane Doe"))
        }

        @Test
        fun `GET employee by id returns 404 when not found`() {
            `when`(orgChartService.getEmployee(99L)).thenReturn(null)

            mockMvc.perform(get("/api/org/employees/99"))
                .andExpect(status().isNotFound)
        }

        @Test
        fun `GET visible employees`() {
            `when`(orgChartService.getVisibleEmployees(null))
                .thenReturn(listOf(employee()))

            mockMvc.perform(get("/api/org/employees/visible"))
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.length()").value(1))
        }

        @Test
        fun `GET random employees`() {
            `when`(orgChartService.getRandomEmployees())
                .thenReturn(listOf(employee()))

            mockMvc.perform(get("/api/org/employees/random"))
                .andExpect(status().isOk)
        }

        @Test
        fun `DELETE employee returns 204`() {
            mockMvc.perform(delete("/api/org/employees/1"))
                .andExpect(status().isNoContent)
        }
    }

    @Nested
    inner class UpdateEmployeeValidation {
        @Test
        fun `PATCH with valid data returns 200`() {
            val update = EmployeeUpdateDto(roleAlias = "SWE")
            `when`(orgChartService.updateEmployee(1L, update)).thenReturn(employee())

            mockMvc.perform(
                patch("/api/org/employees/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(update))
            )
                .andExpect(status().isOk)
        }

        @Test
        fun `PATCH with invalid imageUrl returns 400`() {
            val update = EmployeeUpdateDto(imageUrl = "not-a-url")

            mockMvc.perform(
                patch("/api/org/employees/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(update))
            )
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.errors[0]").value("imageUrl must be a valid URL starting with http(s)://"))
        }

        @Test
        fun `PATCH with invalid linkedinUrl returns 400`() {
            val update = EmployeeUpdateDto(linkedinUrl = "https://twitter.com/user")

            mockMvc.perform(
                patch("/api/org/employees/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(update))
            )
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.errors[0]").value("linkedinUrl must be a valid LinkedIn profile URL"))
        }

        @Test
        fun `PATCH with too-long roleAlias returns 400`() {
            val update = EmployeeUpdateDto(roleAlias = "A".repeat(51))

            mockMvc.perform(
                patch("/api/org/employees/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(update))
            )
                .andExpect(status().isBadRequest)
        }

        @Test
        fun `PATCH with empty string clears field (valid)`() {
            val update = EmployeeUpdateDto(imageUrl = "")
            `when`(orgChartService.updateEmployee(1L, update)).thenReturn(employee())

            mockMvc.perform(
                patch("/api/org/employees/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(update))
            )
                .andExpect(status().isOk)
        }

        @Test
        fun `PATCH nonexistent employee returns 404`() {
            val update = EmployeeUpdateDto(roleAlias = "SWE")
            `when`(orgChartService.updateEmployee(99L, update)).thenReturn(null)

            mockMvc.perform(
                patch("/api/org/employees/99")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(update))
            )
                .andExpect(status().isNotFound)
        }
    }

    @Nested
    inner class HideUnhide {
        @Test
        fun `PATCH hide returns updated employee`() {
            `when`(orgChartService.setHidden(1L, true))
                .thenReturn(employee().copy(hidden = true))

            mockMvc.perform(patch("/api/org/employees/1/hide"))
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.hidden").value(true))
        }

        @Test
        fun `PATCH unhide returns updated employee`() {
            `when`(orgChartService.setHidden(1L, false))
                .thenReturn(employee().copy(hidden = false))

            mockMvc.perform(patch("/api/org/employees/1/unhide"))
                .andExpect(status().isOk)
        }

        @Test
        fun `PATCH hide nonexistent returns 404`() {
            `when`(orgChartService.setHidden(99L, true)).thenReturn(null)

            mockMvc.perform(patch("/api/org/employees/99/hide"))
                .andExpect(status().isNotFound)
        }
    }

    @Nested
    inner class OrgChartEndpoints {
        @Test
        fun `POST chart returns 201`() {
            val node = OrgChartNode(name = "CEO", role = "Chief")
            `when`(orgChartService.importOrgChart(node))
                .thenReturn(listOf(employee(name = "CEO", role = "Chief")))

            mockMvc.perform(
                post("/api/org/charts")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(node))
            )
                .andExpect(status().isCreated)
                .andExpect(jsonPath("$[0].legalName").value("CEO"))
        }

        @Test
        fun `GET chart roots`() {
            `when`(orgChartService.getOrgChartRoots())
                .thenReturn(listOf(employee()))

            mockMvc.perform(get("/api/org/charts"))
                .andExpect(status().isOk)
        }

        @Test
        fun `GET chart tree returns 200`() {
            val tree = OrgChartNode(id = 1, name = "CEO", role = "Chief")
            `when`(orgChartService.getOrgChartTree(1L)).thenReturn(tree)

            mockMvc.perform(get("/api/org/charts/1"))
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.name").value("CEO"))
        }

        @Test
        fun `GET chart tree returns 404 when not found`() {
            `when`(orgChartService.getOrgChartTree(99L)).thenReturn(null)

            mockMvc.perform(get("/api/org/charts/99"))
                .andExpect(status().isNotFound)
        }

        @Test
        fun `DELETE chart returns 204`() {
            mockMvc.perform(delete("/api/org/charts/1"))
                .andExpect(status().isNoContent)
        }
    }

    @Nested
    inner class FlagEndpoints {
        @Test
        fun `POST flag returns 201`() {
            val flag = EmployeeFlag(id = 1, employeeId = 1, reason = "wrong_role", status = "OPEN", createdAt = Instant.now())
            `when`(orgChartService.createFlag(1L, "wrong_role", null)).thenReturn(flag)

            mockMvc.perform(
                post("/api/org/employees/1/flags")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"reason":"wrong_role"}""")
            )
                .andExpect(status().isCreated)
                .andExpect(jsonPath("$.reason").value("wrong_role"))
        }

        @Test
        fun `POST flag for nonexistent employee returns 404`() {
            `when`(orgChartService.createFlag(99L, "wrong_role", null)).thenReturn(null)

            mockMvc.perform(
                post("/api/org/employees/99/flags")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"reason":"wrong_role"}""")
            )
                .andExpect(status().isNotFound)
        }

        @Test
        fun `PATCH resolve flag returns 200`() {
            val flag = EmployeeFlag(id = 1, employeeId = 1, reason = "wrong_role", status = "RESOLVED", createdAt = Instant.now())
            `when`(orgChartService.resolveFlag(1L)).thenReturn(flag)

            mockMvc.perform(patch("/api/org/flags/1/resolve"))
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.status").value("RESOLVED"))
        }

        @Test
        fun `DELETE flag returns 204`() {
            mockMvc.perform(delete("/api/org/flags/1"))
                .andExpect(status().isNoContent)
        }
    }

    @Nested
    inner class SimilarEmployees {
        @Test
        fun `GET similar employees`() {
            `when`(orgChartService.findSimilarEmployees(1L))
                .thenReturn(listOf(employee(2, "Bob", "Engineer")))

            mockMvc.perform(get("/api/org/employees/1/similar"))
                .andExpect(status().isOk)
                .andExpect(jsonPath("$[0].legalName").value("Bob"))
        }
    }
}
