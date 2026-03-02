"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowRight, Sparkles, TrendingUp, Info, Check, ChevronsUpDown, AlertCircle, BadgeDollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { SalaryDistributionChart } from "@/components/SalaryDistributionChart";

interface JobCategory {
    id: number;
    label: string;
    socCodes: string[];
}

interface EstimateResponse {
    location: {
        searched: string;
        matched: string;
        isFallback: boolean;
    };
    jobTitle: string;
    jobLabel: string;
    company: string;
    seniorityLevel: string;
    yearsOfExperience: number;
    blsWages: {
        annual: {
            p10: number | null;
            p25: number | null;
            median: number | null;
            p75: number | null;
            p90: number | null;
            mean: number | null;
        };
        hourly: {
            p10: number | null;
            p25: number | null;
            median: number | null;
            p75: number | null;
            p90: number | null;
            mean: number | null;
        };
        seniorityAdjusted: {
            label: string;
            targetAnnual: number | null;
            rangeAnnual: { low: number | null; high: number | null };
            targetHourly: number | null;
            rangeHourly: { low: number | null; high: number | null };
        };
    };
    totalEmployment: number | null;
    dataSource: string;
    aiEstimate: {
        recommendedSalary: {
            point: number;
            rangeLow: number;
            rangeHigh: number;
        };
        rationale: string;
        negotiationTips: string[];
        confidenceLevel: "high" | "medium" | "low";
        confidenceReason: string;
    };
}

export default function WageWise() {
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState("");
    const [open, setOpen] = useState(false);
    const [locationSearch, setLocationSearch] = useState("");
    const [locationResults, setLocationResults] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
    const [results, setResults] = useState<EstimateResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load job categories from API on mount
    useEffect(() => {
        fetch("/api/jobs")
            .then((res) => res.json())
            .then((data) => setJobCategories(data))
            .catch(() => console.error("Failed to load job categories"));
    }, []);

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
                    { headers: { "User-Agent": "PearlHacks-2026" } }
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResults(null);

        const formData = new FormData(e.currentTarget);

        const payload = {
            jobTitle: formData.get("jobTitle") as string,
            jobLabel: formData.get("jobCategory") as string,
            seniorityLevel: formData.get("seniority") as string,
            yearsOfExperience: parseInt(formData.get("yearsExperience") as string),
            company: formData.get("company") as string,
            location,
            extraContext: formData.get("additionalInfo") as string || undefined,
        };

        // Basic client-side validation
        if (!payload.location) {
            setError("Please select a location.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/estimate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            setResults(data);

            // Scroll to results
            setTimeout(() => {
                document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
                <NavigationMenu viewport={false}>
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
            <div className="container mx-auto max-w-5xl px-4 py-12">

                {/* Header */}
                <div className="text-center mb-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-6xl font-bold text-primary tracking-tight">
                        Know your worth
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Get personalized salary insights based on your role, experience, and location
                    </p>
                </div>

                {/* Info Alert */}
                <Alert className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 border-primary/20 bg-primary/5">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                        Fill out the form below and we'll provide you with a fair salary estimate backed by market data.
                    </AlertDescription>
                </Alert>

                {/* Form Card */}
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 border-2">
                    <CardHeader>
                        <CardTitle className="text-2xl">Tell us about the role</CardTitle>
                        <CardDescription>
                            The more details you provide, the more accurate your estimate will be.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Job Title */}
                            <div className="space-y-2">
                                <Label htmlFor="jobTitle" className="text-base font-medium">
                                    Job Title <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="jobTitle"
                                    name="jobTitle"
                                    placeholder="e.g., Senior Frontend Engineer, Data Scientist II"
                                    required
                                    className="h-11"
                                />
                            </div>

                            {/* Job Category, Seniority & Years of Experience */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2 w-full">
                                    <Label htmlFor="jobCategory" className="text-base font-medium">
                                        Job Category <span className="text-destructive">*</span>
                                    </Label>
                                    <Select name="jobCategory" required>
                                        <SelectTrigger className="min-h-11 w-full">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {jobCategories.length === 0 ? (
                                                <SelectItem value="loading" disabled>Loading...</SelectItem>
                                            ) : (
                                                jobCategories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.label}>
                                                        {cat.label}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 w-full">
                                    <Label htmlFor="seniority" className="text-base font-medium">
                                        Seniority Level <span className="text-destructive">*</span>
                                    </Label>
                                    <Select name="seniority" required>
                                        <SelectTrigger className="min-h-11 w-full">
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="entry">Entry Level / New Grad</SelectItem>
                                            <SelectItem value="mid">Mid-Level</SelectItem>
                                            <SelectItem value="senior">Senior</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 w-full">
                                    <Label htmlFor="yearsExperience" className="text-base font-medium">
                                        Years of Experience <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="yearsExperience"
                                        name="yearsExperience"
                                        type="number"
                                        min="0"
                                        max="99"
                                        step="1"
                                        placeholder="e.g., 3"
                                        required
                                        className="h-11 w-full"
                                    />
                                </div>
                            </div>

                            {/* Company & Location */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="company" className="text-base font-medium">
                                        Company <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="company"
                                        name="company"
                                        required
                                        placeholder="e.g., Google, early-stage startup"
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-base font-medium">
                                        Location <span className="text-destructive">*</span>
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

                            {/* Additional Context */}
                            <div className="space-y-2">
                                <Label htmlFor="additionalInfo" className="text-base font-medium">
                                    Additional Context{" "}
                                    <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
                                </Label>
                                <Textarea
                                    id="additionalInfo"
                                    name="additionalInfo"
                                    placeholder="Competing offers, specialized skills, relevant details from the job description, certifications, etc."
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>

                            {/* Error message */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Submit */}
                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full text-base group"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="animate-pulse">Calculating your estimate...</span>
                                    ) : (
                                        <>
                                            Get My Salary Estimate
                                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                                {isLoading && (
                                    <p className="text-center text-xs text-muted-foreground mt-2">
                                        This usually takes 10–20 seconds while we analyze market data
                                    </p>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Results */}
                {results && (
                    <div id="results" className="mt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

                        {/* Fallback notice */}
                        {results.location.isFallback && (
                            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                                <Info className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                                    Local data wasn't available for {results.location.searched} — showing national averages instead.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Headline recommendation */}
                        <Card>
                            <CardContent>
                                <div className="flex items-start justify-between flex-wrap gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Recommended salary for</p>
                                        <p className="font-semibold text-lg">{results.jobTitle} at {results.company}</p>
                                        <p className="text-sm text-muted-foreground">{results.location.matched}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-4xl font-bold text-primary">
                                            ${results.aiEstimate.recommendedSalary.point.toLocaleString()}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Range: ${results.aiEstimate.recommendedSalary.rangeLow.toLocaleString()} – ${results.aiEstimate.recommendedSalary.rangeHigh.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Chart */}
                        <Card>
                            <CardContent>
                                <SalaryDistributionChart
                                    blsWages={results.blsWages}
                                    aiEstimate={results.aiEstimate}
                                    jobLabel={results.jobLabel}
                                    matchedLocation={results.location.matched}
                                />
                            </CardContent>
                        </Card>

                        {/* AI Rationale */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    Why this estimate
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {results.aiEstimate.rationale}
                                </p>
                                <div className="text-xs text-muted-foreground/60 pt-1">
                                    Confidence: {results.aiEstimate.confidenceLevel} — {results.aiEstimate.confidenceReason}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Negotiation Tips */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Negotiation tips
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {results.aiEstimate.negotiationTips.map((tip, i) => (
                                        <li key={i} className="flex gap-3 text-sm">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                                                {i + 1}
                                            </span>
                                            <span className="text-muted-foreground leading-relaxed">{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Data source */}
                        <p className="text-center text-xs text-muted-foreground">
                            Salary data: {results.dataSource} · Matched area: {results.location.matched}
                        </p>
                    </div>
                )}

                <p className="text-center text-sm text-muted-foreground mt-8 animate-in fade-in duration-1000 delay-500">
                    Your data is used only to generate salary estimates and is not stored or shared.
                </p>
            </div>
        </div>
        </>
    );
}