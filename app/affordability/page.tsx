"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, Info, AlertCircle, Home, ShoppingCart, Car, Zap, Heart, MoreHorizontal, BadgeDollarSign, ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

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
  rent:       { icon: Home,          label: "Housing", color: "#ef4444" },
  groceries:  { icon: ShoppingCart,  label: "Groceries", color: "#f97316 " }, 
  transport:  { icon: Car,           label: "Transport", color: "#f59e0b" }, 
  utilities:  { icon: Zap,           label: "Utilities", color: "#10b981" },
  healthcare: { icon: Heart,         label: "Healthcare", color: "#3b82f6" },
  misc:       { icon: MoreHorizontal,label: "Misc.", color: "#8b5cf6 " },
};

export default function AffordabilityPage() {
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [open, setOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AffordabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Location search with debounce
  useEffect(() => {
    if (locationSearch.length < 2) {
      setLocationResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(locationSearch)}&country=United States&format=json&limit=5`,
          { headers: { "User-Agent": "WageWise-Hackathon" } }
        );
        if (response.ok) {
          const data = await response.json();

          const stateAbbreviations: { [key: string]: string } = {
            "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
            "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
            "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
            "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
            "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
            "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
            "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
            "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
            "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
            "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
          };

          const cities = data
            .map((item: any) => {
              const parts = item.display_name.split(", ");
              const city = item.name || parts[0];
              let state = null;
              for (let i = parts.length - 2; i >= 0; i--) {
                const part = parts[i];
                if (stateAbbreviations[part] && !/^\d+$/.test(part)) {
                  state = part;
                  break;
                }
              }
              if (!city || !state) return null;
              return `${city}, ${stateAbbreviations[state] || state}`;
            })
            .filter(Boolean)
            .filter((city: string, index: number, self: string[]) => self.indexOf(city) === index);

          setLocationResults(cities);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationSearch]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);

    // Extract just the city name (before the comma)
    const cityName = location.split(",")[0].trim();

    // Validation
    if (!cityName) {
      setError("Please select a city.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/affordability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary: parseFloat(salary.replace(/,/g, "")),
          city: cityName, // Send only the city name
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResults(data); // This line sets the results state so they display

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
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <BadgeDollarSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl hidden sm:inline-block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              WageWise
            </span>
          </Link>

          <NavigationMenu>
            <NavigationMenuList className="gap-1">
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
        <div className="container mx-auto max-w-5xl px-4 py-12">

          {/* Header */}
          <div className="text-center mb-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-6xl font-bold text-primary tracking-tight">
              Can I Afford This City?
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              See how far a salary offer actually goes in your target city
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
                    <Label htmlFor="location" className="text-base font-medium">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full h-11 justify-between font-normal"
                        >
                          {location || "Type to search US cities..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="e.g., San Francisco, Dallas..."
                            value={locationSearch}
                            onValueChange={setLocationSearch}
                          />
                          <CommandList>
                            {isSearching && (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Searching...
                              </div>
                            )}
                            {!isSearching && locationSearch.length >= 2 && locationResults.length === 0 && (
                              <CommandEmpty>No cities found.</CommandEmpty>
                            )}
                            {locationResults.length > 0 && (
                              <CommandGroup>
                                {locationResults.map((city) => (
                                  <CommandItem
                                    key={city}
                                    value={city}
                                    onSelect={() => {
                                      setLocation(city);
                                      setOpen(false);
                                      setLocationSearch("");
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", location === city ? "opacity-100" : "opacity-0")} />
                                    {city}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                {isLoading && (
                    <p className="text-center text-xs text-muted-foreground mt-2">
                        This usually takes 10–20 seconds while we calculate cost of living impacts
                    </p>
                )}
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
                    <CardContent>
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

              {/* Budget Breakdown with Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Budget Breakdown</CardTitle>
                  <CardDescription>
                    How your ${results.budget.monthlyTakeHome.toLocaleString()} monthly take-home is allocated
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="flex items-center justify-center">
                      <ChartContainer
                        config={{
                          rent:       { icon: Home,          label: "Housing", color: "#ef4444" },
                          groceries:  { label: "Groceries", color: "#f97316 " }, 
                          transport:  { label: "Transport", color: "#f59e0b" }, 
                          utilities:  { label: "Utilities", color: "#10b981" },
                          healthcare: { label: "Healthcare", color: "#3b82f6" },
                          misc:       { label: "Misc.", color: "#8b5cf6 " },
                        }}
                        className="h-[280px] w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                ...Object.entries(expenseIcons).map(([key, { label, color }]) => ({
                                  name: label,
                                  value: results.budget.expenses[key as keyof typeof results.budget.expenses],
                                  fill: color,
                                })),
                                {
                                  name: results.budget.remaining >= 0 ? "Savings" : "Shortfall",
                                  value: Math.abs(results.budget.remaining),
                                  fill: results.budget.remaining >= 0 ? "#6b7280" : "#ef4444", // Grey for savings, red for shortfall
                                }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ cx, cy, midAngle, outerRadius, payload }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = outerRadius + 30;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                const pct = Math.round((payload.value / results.budget.monthlyTakeHome) * 100);

                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill="currentColor"
                                    textAnchor={x > cx ? "start" : "end"}
                                    dominantBaseline="central"
                                    className="text-xs font-medium text-foreground"
                                  >
                                    {`${payload.name} ${pct}%`}
                                  </text>
                                );
                              }}
                              labelLine={{
                                strokeWidth: 1,
                              }}
                            >
                              {[
                                ...Object.entries(expenseIcons).map(([_, { color }]) => color),
                                results.budget.remaining >= 0 ? "#6b7280" : "#6b7280"
                              ].map((color, index) => (
                                <Cell key={`cell-${index}`} fill={color} />
                              ))}
                            </Pie>
                            <ChartTooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                                      <p className="font-semibold text-sm">{payload[0].name}</p>
                                      <p className="text-muted-foreground text-sm">
                                        {fmt(payload[0].value as number)}/mo
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {Math.round(((payload[0].value as number) / results.budget.expenses.total) * 100)}% of expenses
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>

                    {/* Expense List */}
                    <div className="space-y-3">
                      {(Object.entries(expenseIcons) as [keyof typeof expenseIcons, typeof expenseIcons[keyof typeof expenseIcons]][]).map(([key, { icon: Icon, label, color }]) => {
                        const amount = results.budget.expenses[key as keyof typeof results.budget.expenses];
                        if (typeof amount !== "number") return null;
                          const pct = Math.round((amount / results.budget.monthlyTakeHome) * 100);                        return (
                          <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{label}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{fmt(amount)}</p>
                              <p className="text-xs text-muted-foreground">{pct}%</p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Total & Remaining */}
                      <div className="pt-3 border-t space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Total Expenses</span>
                          <span className="font-semibold">{fmt(results.budget.expenses.total)}/mo</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {results.budget.remaining >= 0 ? "Remaining for Savings" : "Monthly Shortfall"}
                          </span>
                          <span className={`text-base font-bold ${results.budget.remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {results.budget.remaining >= 0 ? "+" : ""}{fmt(results.budget.remaining)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Commentary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What this means for you...</CardTitle>
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
