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
import { ArrowRight, Sparkles, TrendingUp, Info, Check, ChevronsUpDown, Handshake } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function WageWise() {
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState("");
    const [open, setOpen] = useState(false);
    const [locationSearch, setLocationSearch] = useState("");
    const [locationResults, setLocationResults] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);

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
            {
            headers: {
                'User-Agent': 'CareerKit-Hackathon'
            }
            }
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
            "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
            };

            const cities = data
                .map((item: any) => {
                    const parts = item.display_name.split(", ");
                    
                    // Format: "Chicago, South Chicago Township, Cook County, Illinois, United States"
                    // first element (city) and second-to-last element (state)
                    const city = item.name || parts[0];

                    // Find the state by looking for it in our abbreviations map
                    // This filters out counties, zipcodes, and "United States"
                    let state = null;
                    for (let i = parts.length - 2; i >= 0; i--) {
                        const part = parts[i];
                        // Check if it's a valid state name (not a number/zipcode)
                        if (stateAbbreviations[part] && !/^\d+$/.test(part)) {
                            state = part;
                            break;
                        }
                    }

                    if (!city || !state || state === "United States") return null;
                    
                    const stateAbbr = stateAbbreviations[state] || state;
                    return `${city}, ${stateAbbr}`;
                })
                .filter((city: string | null) => city !== null)
                .filter((city: string, index: number, self: string[]) => 
                    self.indexOf(city) === index
                );
            
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

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        
        const formData = new FormData(e.currentTarget);
        const data = {
            jobTitle: formData.get("jobTitle"),
            jobCategory: formData.get("jobCategory"),
            seniority: formData.get("seniority"),
            yearsExperience: formData.get("yearsExperience"),
            company: formData.get("company"),
            location: location,
            jobDescription: formData.get("jobDescription"),
            additionalInfo: formData.get("additionalInfo"),
        };
        
        console.log(data);
        
        setTimeout(() => {
            setIsLoading(false);
        }, 2000);
    };

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

        {/* Main Content */}
        <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
            <div className="container mx-auto max-w-3xl px-4 py-12">
            {/* Header */}
            <div className="text-center mb-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-6xl font-bold  text-primary cx tracking-tight">
                Wage Wise
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get personalized salary insights based on your role, experience, and location
                </p>
            </div>

            {/* Info Alert */}
            <Alert className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 border-primary/20 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                Fill out the form below and we'll provide you with a fair salary range backed by market data.
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
                        placeholder="e.g., Software Engineer, Product Manager, Data Analyst"
                        required
                        className="h-11"
                    />
                    </div>

                    {/* Job Category, Seniority & Years of Experience (3 columns) */}
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
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="data">Data & Analytics</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                            <SelectItem value="operations">Operations</SelectItem>
                            <SelectItem value="hr">Human Resources</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
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

                    {/* Company & Location (side by side) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="company" className="text-base font-medium">
                        Company <span className="text-destructive">*</span>
                        </Label>
                        <Input
                        id="company"
                        name="company"
                        required
                        placeholder="e.g., Google, Startup, etc."
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
                                        <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            location === city ? "opacity-100" : "opacity-0"
                                        )}
                                        />
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

                    {/* Optional: Additional Info */}
                    <div className="space-y-2">
                    <Label htmlFor="additionalInfo" className="text-base font-medium">
                        Additional Context <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                        id="additionalInfo"
                        name="additionalInfo"
                        placeholder="Any other relevant info? e.g., specialized skills, certifications, details from the job description..."
                        rows={3}
                        className="resize-none"
                    />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full text-base group"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                        <>
                            <span className="animate-pulse">Calculating...</span>
                        </>
                        ) : (
                        <>
                            Get My Salary Estimate
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                        )}
                    </Button>
                    </div>
                </form>
                </CardContent>
            </Card>

            {/* Bottom Note */}
            <p className="text-center text-sm text-muted-foreground mt-8 animate-in fade-in duration-1000 delay-500">
                Your data is used only to generate salary estimates and is not stored or shared.
            </p>
            </div>
        </div>
        </>
    );
}