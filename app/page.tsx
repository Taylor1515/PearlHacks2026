import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { ArrowRight, DollarSign, FileCheck, HandCoins, Handshake, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Handshake className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl hidden sm:inline-block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              ProjectName
            </span>
          </Link>

          {/* Navigation Menu */}
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <Link href="/">
                  <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all hover:bg-accent/50 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 hover:scale-105 duration-200">
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/wagewise">
                  <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 hover:scale-105 duration-200">
                    Wage Wise
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/resumereview">
                  <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 hover:scale-105 duration-200">
                    Resume Review
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
      
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-20 px-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-5xl mt-5 md:text-7xl font-bold tracking-tight">
              Know Your Worth.
              <br />
              <span className="text-primary">Land Your Role.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get data-backed salary insights and AI-powered resume feedback to negotiate confidently 
              and land the job you deserve.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-in fade-in slide-in-from-bottom-4 delay-300">
              <Link href="/wagewise">
                <Button size="lg" className="text-lg group">
                  Check Your Worth
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/resumereview">
                <Button size="lg" variant="outline" className="text-lg">
                  Review Your Resume
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Career Toolkit
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Two powerful tools to help you navigate your job search with confidence
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Wage Wise Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-left duration-700 border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg border-2 border-primary flex items-center justify-center mb-4 group-hover:bg-accent/80 transition-colors">
                  <DollarSign className="w-6 h-6 text-foreground" />
                </div>
                <CardTitle className="text-2xl">Wage Wise</CardTitle>
                <CardDescription className="text-base">
                  Data-driven salary insights for your role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Stop guessing. Get personalized salary ranges, backed by real market data, based on your experience, 
                  location, and role.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <TrendingUp className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Fair compensation estimates tailored to you</span>
                  </li>
                  <li className="flex items-start">
                    <TrendingUp className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Transparent methodology & confidence scores</span>
                  </li>
                  {/* <li className="flex items-start">
                    <TrendingUp className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Negotiation-ready talking points</span>
                  </li> */}
                </ul>
                <Link href="/wagewise" className="block pt-2">
                  <Button className="w-full group">
                    Get Your Estimate
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Resume Review Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-right duration-700 delay-150 border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-accent/80 transition-colors">
                  <FileCheck className="w-6 h-6 text-accent-foreground" />
                </div>
                <CardTitle className="text-2xl">Resume Review</CardTitle>
                <CardDescription className="text-base">
                  AI-powered feedback to land interviews
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Upload your resume and job description to get instant, actionable feedback 
                  on how to stand out and match what recruiters want.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Sparkles className="w-5 h-5 text-accent-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Match score against job requirements</span>
                  </li>
                  <li className="flex items-start">
                    <Sparkles className="w-5 h-5 text-accent-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Missing keywords & skills identified</span>
                  </li>
                  {/* <li className="flex items-start">
                    <Sparkles className="w-5 h-5 text-accent-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Rewritten bullets tailored to the role</span>
                  </li> */}
                </ul>
                <Link href="/resumereview" className="block pt-2">
                  <Button variant="secondary" className="w-full group">
                    Review Your Resume
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center space-y-6 animate-in fade-in duration-700">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to take control of your career?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join new grads and professionals who are negotiating better offers and landing roles 
            they're truly qualified for.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/wagewise">
              <Button size="lg" className="text-lg">
                Start with Wage Wise
              </Button>
            </Link>
            <Link href="/resumereview">
              <Button size="lg" variant="outline" className="text-lg">
                Or Review Your Resume
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>

    </>
  );
}