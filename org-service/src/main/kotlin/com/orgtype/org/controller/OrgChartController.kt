package com.orgtype.org.controller

import com.orgtype.org.dto.CreateFlagDto
import com.orgtype.org.dto.EmployeeUpdateDto
import com.orgtype.org.dto.FlagWithEmployee
import com.orgtype.org.dto.OrgChartNode
import com.orgtype.org.model.Employee
import com.orgtype.org.model.EmployeeFlag
import com.orgtype.org.service.OrgChartService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/org")
class OrgChartController(private val orgChartService: OrgChartService) {

    @PostMapping("/charts")
    @ResponseStatus(HttpStatus.CREATED)
    fun importOrgChart(@RequestBody root: OrgChartNode): List<Employee> {
        return orgChartService.importOrgChart(root)
    }

    @GetMapping("/charts")
    fun getOrgChartRoots(): List<Employee> {
        return orgChartService.getOrgChartRoots()
    }

    @GetMapping("/charts/{rootId}")
    fun getOrgChartTree(@PathVariable rootId: Long): ResponseEntity<OrgChartNode> {
        val tree = orgChartService.getOrgChartTree(rootId)
        return if (tree != null) ResponseEntity.ok(tree) else ResponseEntity.notFound().build()
    }

    @DeleteMapping("/charts/{rootId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteOrgChart(@PathVariable rootId: Long) {
        orgChartService.deleteOrgChart(rootId)
    }

    @GetMapping("/employees")
    fun getAllEmployees(@RequestParam sort: String?): List<Employee> {
        return orgChartService.getAllEmployees(sort)
    }

    @GetMapping("/employees/visible")
    fun getVisibleEmployees(@RequestParam sort: String?): List<Employee> {
        return orgChartService.getVisibleEmployees(sort)
    }

    @GetMapping("/employees/random")
    fun getRandomEmployees(): List<Employee> {
        return orgChartService.getRandomEmployees()
    }

    @GetMapping("/employees/{id}")
    fun getEmployee(@PathVariable id: Long): ResponseEntity<Employee> {
        val employee = orgChartService.getEmployee(id)
        return if (employee != null) ResponseEntity.ok(employee) else ResponseEntity.notFound().build()
    }

    @PatchMapping("/employees/{id}")
    fun updateEmployee(
        @PathVariable id: Long,
        @RequestBody update: EmployeeUpdateDto
    ): ResponseEntity<Any> {
        val errors = mutableListOf<String>()
        val urlPattern = Regex("^https?://.+")
        val linkedinPattern = Regex("^https?://(www\\.)?linkedin\\.com/in/.+")

        // Only validate non-empty values (empty string means "clear this field")
        update.roleAlias?.let {
            if (it.isNotEmpty() && it.length > 50) errors.add("roleAlias must be 50 characters or fewer")
        }
        update.imageUrl?.let {
            if (it.isNotEmpty() && !urlPattern.matches(it)) errors.add("imageUrl must be a valid URL starting with http(s)://")
        }
        update.linkedinUrl?.let {
            if (it.isNotEmpty() && !linkedinPattern.matches(it)) errors.add("linkedinUrl must be a valid LinkedIn profile URL")
        }
        if (errors.isNotEmpty()) {
            return ResponseEntity.badRequest().body(mapOf("errors" to errors))
        }

        val employee = orgChartService.updateEmployee(id, update)
        return if (employee != null) ResponseEntity.ok(employee) else ResponseEntity.notFound().build()
    }

    @PatchMapping("/employees/{id}/hide")
    fun hideEmployee(@PathVariable id: Long): ResponseEntity<Employee> {
        val employee = orgChartService.setHidden(id, true)
        return if (employee != null) ResponseEntity.ok(employee) else ResponseEntity.notFound().build()
    }

    @PatchMapping("/employees/{id}/unhide")
    fun unhideEmployee(@PathVariable id: Long): ResponseEntity<Employee> {
        val employee = orgChartService.setHidden(id, false)
        return if (employee != null) ResponseEntity.ok(employee) else ResponseEntity.notFound().build()
    }

    @DeleteMapping("/employees/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteEmployee(@PathVariable id: Long) {
        orgChartService.deleteEmployee(id)
    }

    @GetMapping("/employees/{id}/similar")
    fun findSimilarEmployees(@PathVariable id: Long): List<Employee> {
        return orgChartService.findSimilarEmployees(id)
    }

    // --- Flags ---

    @PostMapping("/employees/{id}/flags")
    @ResponseStatus(HttpStatus.CREATED)
    fun createFlag(
        @PathVariable id: Long,
        @RequestBody dto: CreateFlagDto
    ): ResponseEntity<EmployeeFlag> {
        val flag = orgChartService.createFlag(id, dto.reason, dto.note)
        return if (flag != null) ResponseEntity.status(HttpStatus.CREATED).body(flag)
        else ResponseEntity.notFound().build()
    }

    @GetMapping("/flags")
    fun getAllFlags(@RequestParam status: String?): List<FlagWithEmployee> {
        return orgChartService.getAllFlags(status)
    }

    @PatchMapping("/flags/{flagId}/resolve")
    fun resolveFlag(@PathVariable flagId: Long): ResponseEntity<EmployeeFlag> {
        val flag = orgChartService.resolveFlag(flagId)
        return if (flag != null) ResponseEntity.ok(flag) else ResponseEntity.notFound().build()
    }

    @DeleteMapping("/flags/{flagId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteFlag(@PathVariable flagId: Long) {
        orgChartService.deleteFlag(flagId)
    }
}
