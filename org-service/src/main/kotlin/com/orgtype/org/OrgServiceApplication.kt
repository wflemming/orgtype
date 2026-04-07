package com.orgtype.org

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class OrgServiceApplication

fun main(args: Array<String>) {
    runApplication<OrgServiceApplication>(*args)
}
