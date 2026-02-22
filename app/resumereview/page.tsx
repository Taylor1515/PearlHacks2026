import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Handshake } from "lucide-react";
import Link from "next/link";

export default function ResumeReview() {
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
        <div>
            <h1> This is the resume page! </h1>
        </div>
        </>
    );
}
