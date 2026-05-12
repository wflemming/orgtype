package com.orgtype.org.playground

import org.springframework.boot.CommandLineRunner
import org.springframework.stereotype.Component

@Component
class SayHeyCommandLineRunner(): CommandLineRunner {
    override fun run(vararg args: String?) {
        println("Starting SayHeyCommandLineRunner");
    }
}