"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, FileCode, Cog, BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      <header className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
            CloudBlueprint
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 relative z-10 pb-16">
        {/* Title */}
        <div className="text-center mt-8 mb-16">
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent dark:from-white dark:via-blue-400 dark:to-purple-400 mb-6 leading-tight">
            Azure Infrastructure Made Simple
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Generate production-ready Azure Infrastructure as Code repositories
            with enterprise best practices, naming conventions, and CI/CD
            pipelines in minutes.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          <Card className="h-full group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Code className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">IaC Scaffolder</CardTitle>
              <CardDescription className="text-base">
                Generate complete Azure Infrastructure as Code repositories with
                Bicep modules and CI/CD pipelines
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/wizard">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="h-full group opacity-60 hover:opacity-80 transition-opacity duration-300 border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl flex items-center justify-center mb-4">
                <FileCode className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Policy Generator</CardTitle>
              <CardDescription className="text-base">
                Create Azure Policy definitions and assignments for governance
                and compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                variant="secondary"
                disabled
                className="w-full py-3 rounded-lg"
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="h-full group opacity-60 hover:opacity-80 transition-opacity duration-300 border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl flex items-center justify-center mb-4">
                <Cog className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Config Builder</CardTitle>
              <CardDescription className="text-base">
                Build configuration files for Azure services with validation and
                best practices
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                variant="secondary"
                disabled
                className="w-full py-3 rounded-lg"
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="h-full group opacity-60 hover:opacity-80 transition-opacity duration-300 border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Documentation</CardTitle>
              <CardDescription className="text-base">
                Generate comprehensive documentation for your Azure
                infrastructure and deployments
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                variant="secondary"
                disabled
                className="w-full py-3 rounded-lg"
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="text-center mb-16">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent dark:from-white dark:to-blue-400 mb-8">
            Why CloudBlueprint?
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="group p-6 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h4 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
                Enterprise Ready
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Built with enterprise best practices, security standards, and
                governance patterns.
              </p>
            </div>
            <div className="group p-6 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
                Zero Backend
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                100% client-side generation. No data leaves your browser. No
                servers to maintain.
              </p>
            </div>
            <div className="group p-6 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h4 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
                Production Tested
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Templates tested in real-world scenarios with proper naming
                conventions and module structure.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 text-center text-gray-600 dark:text-gray-400 relative z-10 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <p className="text-sm">
            &copy; 2024 CloudBlueprint. Open source project for the Azure
            community.
          </p>
        </div>
      </footer>
    </div>
  );
}
