import React from "react";
import { Link } from "react-router-dom";

const PawIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
        <ellipse cx="16" cy="21" rx="9" ry="7" />
        <ellipse cx="5" cy="10" rx="4" ry="5" transform="rotate(-20 5 10)" />
        <ellipse cx="13" cy="4.5" rx="4" ry="5.5" transform="rotate(-6 13 4.5)" />
        <ellipse cx="19" cy="4.5" rx="4" ry="5.5" transform="rotate(6 19 4.5)" />
        <ellipse cx="27" cy="10" rx="4" ry="5" transform="rotate(20 27 10)" />
    </svg>
);

const SIZES = {
    sm: { badge: "w-6 h-6", icon: "w-3.5 h-3.5", text: "text-base" },
    md: { badge: "w-7 h-7", icon: "w-4 h-4", text: "text-xl" },
    lg: { badge: "w-9 h-9", icon: "w-5 h-5", text: "text-2xl" },
} as const;

export const BrandLogo: React.FC<{
    to?: string;
    /** "onDark" for use on dark/brand backgrounds (white text+badge), "onLight" for use on white/gray backgrounds (brand-colored text+badge) */
    variant?: "onDark" | "onLight";
    size?: keyof typeof SIZES;
    className?: string;
}> = ({ to = "/", variant = "onLight", size = "md", className = "" }) => {
    const s = SIZES[size];
    const textClass = variant === "onDark" ? "text-white" : "text-gray-900";
    const badgeClass =
        variant === "onDark"
            ? "bg-white/20 text-white"
            : "bg-brand-600 text-white";

    return (
        <Link
            to={to}
            className={`inline-flex items-center gap-2 font-bold tracking-tight hover:opacity-80 transition ${textClass} ${s.text} ${className}`}
        >
            <span
                className={`inline-flex items-center justify-center rounded-full shrink-0 ${s.badge} ${badgeClass}`}
            >
                <PawIcon className={s.icon} />
            </span>
            Vetfind
        </Link>
    );
};

export default BrandLogo;
