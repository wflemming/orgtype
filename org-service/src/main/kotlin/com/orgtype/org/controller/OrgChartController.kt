package com.orgtype.org.controller

import com.orgtype.org.dto.OrgChartNode
import com.orgtype.org.model.Employee
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

    @GetMapping("/employees/random")
    fun getRandomEmployees(): List<Employee> {
        return orgChartService.getRandomEmployees()
    }

    @GetMapping("/employees/{id}")
    fun getEmployee(@PathVariable id: Long): ResponseEntity<Employee> {
        val employee = orgChartService.getEmployee(id)
        return if (employee != null) ResponseEntity.ok(employee) else ResponseEntity.notFound().build()
    }
}
