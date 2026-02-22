import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { ArrowRight, BadgeDollarSign, BarChart3, Brain, Home, HandCoins, Shield, Utensils, Bus,  Building2 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <BadgeDollarSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl hidden sm:inline-block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              WageWise
            </span>
          </Link>

          {/* Navigation Menu */}
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/" className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-transparent hover:bg-transparent focus:bg-transparent transition-[transform,color] duration-200 hover:text-primary focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 hover:scale-105">
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/salary" className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-transparent hover:bg-transparent focus:bg-transparent transition-[transform,color] duration-200 hover:text-primary focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 hover:scale-105">
                    Salary Estimate
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/affordability" className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-transparent hover:bg-transparent focus:bg-transparent transition-[transform,color] duration-200 hover:text-primary focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 hover:scale-105">
                    City Affordability
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
      
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-20 px-4">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">

              <h1 className="text-5xl mt-5 md:text-7xl font-bold tracking-tight">
                Know your worth.
                <br />
                <span className="text-primary">Choose your path.</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Get data-backed salary insights and understand what that money means for your
                quality of life in different cities, so you can make informed career decisions.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-in fade-in slide-in-from-bottom-4 delay-300">
                <Link href="/salary">
                  <Button size="lg" className="text-lg group">
                    Salary Estimate
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/affordability">
                  <Button size="lg" variant="outline" className="text-lg group">
                    City Affordability
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Your WageWise Toolkit</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Two tools to help you negotiate smarter and plan your future.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Salary Estimate */}
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-left duration-700 border-2">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg border-2 border-primary flex items-center justify-center mb-4 group-hover:bg-accent/80 transition-colors">
                    <HandCoins className="w-6 h-6 text-foreground" />
                  </div>
                  <CardTitle className="text-2xl">Salary Estimate</CardTitle>
                  <CardDescription className="text-base">
                    Market-backed pay estimates for your role
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Get a salary estimate backed by real Bureau of Labor Statistics market data and AI-powered analysis
                    tailored to your experience, location, and role.
                  </p>

                  {/* Three small boxes */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg border bg-muted/30 text-center">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <p className="text-xs font-medium">BLS Data</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg border bg-muted/30 text-center">
                      <Brain className="w-5 h-5 text-primary" />
                      <p className="text-xs font-medium">AI Refined</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg border bg-muted/30 text-center">
                      <Shield className="w-5 h-5 text-primary" />
                      <p className="text-xs font-medium">Confidence</p>
                    </div>
                  </div>

                  <Link href="/salary" className="block pt-2">
                    <Button className="w-full group">
                      Get My Estimate
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* City Affordability */}
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-right duration-700 delay-150 border-2">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-accent/80 transition-colors">
                    <Building2 className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-2xl">City Affordability</CardTitle>
                  <CardDescription className="text-base">
                    Cost of living impacts based on salary and location
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Enter a salary and city to see a breakdown of typical monthly costs for rent, food,
                    transportation, and what percentage of your income they take.
                  </p>

                  {/* Three small boxes */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg border bg-muted/30 text-center">
                      <Home className="w-5 h-5 text-accent-foreground" />
                      <p className="text-xs font-medium">Housing</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg border bg-muted/30 text-center">
                      <Utensils className="w-5 h-5 text-accent-foreground" />
                      <p className="text-xs font-medium">Food</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg border bg-muted/30 text-center">
                      <Bus className="w-5 h-5 text-accent-foreground" />
                      <p className="text-xs font-medium">Transport</p>
                    </div>
                  </div>

                  <Link href="/affordability" className="block pt-2">
                    <Button variant="secondary" className="w-full group">
                      Check Affordability
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 px-4 bg-primary/5">
          <div className="container mx-auto max-w-4xl text-center space-y-6 animate-in fade-in duration-700">
            <h2 className="text-3xl md:text-4xl font-bold">
              Make the decision that's right for you.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Use salary data and cost of living insight to choose the offer that supports your goals
              and lifestyle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/salary">
                <Button size="lg" className="text-lg">
                  Start with Salary Estimate
                </Button>
              </Link>
              <Link href="/affordability">
                <Button size="lg" variant="outline" className="text-lg">
                  Then Check Affordability
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}