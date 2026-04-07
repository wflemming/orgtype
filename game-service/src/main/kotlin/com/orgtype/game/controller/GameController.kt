package com.orgtype.game.controller

import com.orgtype.game.dto.EmployeeDto
import com.orgtype.game.service.GameService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/game")
class GameController(private val gameService: GameService) {

    @GetMapping("/employees")
    fun getEmployees(@RequestParam sort: String?): List<EmployeeDto> {
        return gameService.getEmployees(sort)
    }

    @GetMapping("/employees/random")
    fun getRandomEmployees(): List<EmployeeDto> {
        return gameService.getRandomEmployees()
    }
}
