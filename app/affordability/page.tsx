"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, Handshake, Info, AlertCircle, Home, ShoppingCart, Car, Zap, Heart, MoreHorizontal, BadgeDollarSign } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AffordabilityResponse {
  city: string;
  isEstimated: boolean;
  annualSalary: number;
  budget: {
    monthlyTakeHome: number;
    expenses: {
      rent: number;
      groceries: number;
      transport: number;
      utilities: number;
      healthcare: number;
      misc: number;
      total: number;
    };
    remaining: number;
    savingsRate: number;
    verdict: "comfortable" | "tight" | "difficult";
  };
  aiCommentary: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) => `$${n.toLocaleString()}`;

const verdictConfig = {
  comfortable: {
    label: "Comfortable",
    description: "You'd have room to save and enjoy life",
    color: "hsl(142, 71%, 45%)",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-900",
    text: "text-green-700 dark:text-green-400",
  },
  tight: {
    label: "Tight but Manageable",
    description: "Doable with careful budgeting",
    color: "hsl(38, 92%, 50%)",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900",
    text: "text-amber-700 dark:text-amber-400",
  },
  difficult: {
    label: "Difficult",
    description: "This salary would be a financial stretch",
    color: "hsl(0, 84%, 60%)",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900",
    text: "text-red-700 dark:text-red-400",
  },
};

const expenseIcons = {
  rent:       { icon: Home,          label: "Rent (1BR)" },
  groceries:  { icon: ShoppingCart,  label: "Groceries" },
  transport:  { icon: Car,           label: "Transportation" },
  utilities:  { icon: Zap,           label: "Utilities" },
  healthcare: { icon: Heart,         label: "Healthcare" },
  misc:       { icon: MoreHorizontal,label: "Miscellaneous" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AffordabilityPage() {
  const [salary, setSalary] = useState("");
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AffordabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/affordability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary: parseFloat(salary.replace(/,/g, "")),
          city,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResults(data);

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

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

      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto max-w-2xl px-4 py-12">

          {/* Header */}
          <div className="text-center mb-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-6xl font-bold text-primary tracking-tight">
              Can I Afford This City?
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              See how far a salary offer actually goes in your target city — rent, groceries, and all.
            </p>
          </div>

          {/* Form */}
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 border-2">
            <CardHeader>
              <CardTitle className="text-xl">Enter your details</CardTitle>
              <CardDescription>
                We'll estimate your monthly budget breakdown and tell you how it stacks up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary" className="text-base font-medium">
                      Annual Salary <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        id="salary"
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 115,000"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        required
                        className="h-11 pl-7"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-base font-medium">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="e.g. San Francisco, Austin"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" size="lg" className="w-full text-base group" disabled={isLoading}>
                  {isLoading ? (
                    <span className="animate-pulse">Calculating...</span>
                  ) : (
                    <>
                      Check Affordability
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <div id="results" className="mt-8 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">

              {/* Estimated data notice */}
              {results.isEstimated && (
                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                    We don't have exact data for {results.city} — estimates are based on national averages.
                  </AlertDescription>
                </Alert>
              )}

              {/* Verdict card */}
              {(() => {
                const v = verdictConfig[results.budget.verdict];
                return (
                  <Card className={`border-2 ${v.border} ${v.bg}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {fmt(results.annualSalary)}/year in {results.city}
                          </p>
                          <p className={`text-2xl font-bold mt-1 ${v.text}`}>
                            {v.label}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">{v.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Monthly take-home</p>
                          <p className="text-3xl font-bold text-foreground">
                            {fmt(results.budget.monthlyTakeHome)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            ~{results.budget.savingsRate}% left after expenses
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Budget breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Budget Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(Object.entries(expenseIcons) as [keyof typeof expenseIcons, typeof expenseIcons[keyof typeof expenseIcons]][]).map(([key, { icon: Icon, label }]) => {
                    const amount = results.budget.expenses[key as keyof typeof results.budget.expenses];
                    if (typeof amount !== "number") return null;
                    const pct = Math.round((amount / results.budget.expenses.total) * 100);
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{pct}%</span>
                            <span className="text-sm font-medium w-20 text-right">{fmt(amount)}/mo</span>
                          </div>
                        </div>
                        <div
                          style={{
                            height: "8px",
                            width: "100%",
                            borderRadius: "999px",
                            backgroundColor: "hsl(var(--muted))",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              borderRadius: "999px",
                              backgroundColor: "hsl(var(--primary))",
                              opacity: 0.7,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Divider + remaining */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {results.budget.remaining >= 0 ? "Remaining" : "Shortfall"}
                      </span>
                      <span className={`text-sm font-bold ${results.budget.remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {results.budget.remaining >= 0 ? "+" : ""}{fmt(results.budget.remaining)}/mo
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* AI Commentary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What this means for you</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {results.aiCommentary}
                  </p>
                </CardContent>
              </Card>

              <p className="text-center text-xs text-muted-foreground">
                Estimates based on 2024 average costs. Take-home pay assumes ~28% effective tax rate. Individual expenses will vary.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
