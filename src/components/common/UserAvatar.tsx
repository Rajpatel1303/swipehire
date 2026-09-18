import React, { useState } from "react";
import { ProfilePhotoSettings, ProfilePhotoShape, ProfilePhotoFrame, ProfilePhotoFilter } from "../../types";
import { User } from "lucide-react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "hero";

export interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: AvatarSize | string;
  settings?: ProfilePhotoSettings | null;
  className?: string;
  imgClassName?: string;
  fallbackText?: string;
  badge?: React.ReactNode;
  badgePosition?: "bottom-right" | "top-right" | "bottom-left" | "top-left";
  onClick?: () => void;
  title?: string;
}

const SIZE_MAP: Record<AvatarSize, { container: string; text: string; icon: string }> = {
  xs: { container: "w-6 h-6", text: "text-[9px]", icon: "w-3 h-3" },
  sm: { container: "w-8 h-8", text: "text-[11px]", icon: "w-4 h-4" },
  md: { container: "w-10 h-10", text: "text-xs", icon: "w-5 h-5" },
  lg: { container: "w-12 h-12", text: "text-sm", icon: "w-6 h-6" },
  xl: { container: "w-16 h-16", text: "text-base", icon: "w-8 h-8" },
  "2xl": { container: "w-20 h-20", text: "text-lg", icon: "w-10 h-10" },
  "3xl": { container: "w-24 h-24", text: "text-xl", icon: "w-12 h-12" },
  hero: { container: "w-32 h-32", text: "text-2xl", icon: "w-14 h-14" },
};

export const SHAPE_CLIP_PATHS: Record<ProfilePhotoShape, string | undefined> = {
  circle: undefined,
  squircle: undefined,
  rounded: undefined,
  hexagon: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
  octagon: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
  shield: "polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)",
};

export const SHAPE_ROUNDED_CLASSES: Record<ProfilePhotoShape, string> = {
  circle: "rounded-full",
  squircle: "rounded-[28%]",
  rounded: "rounded-2xl",
  hexagon: "rounded-none",
  octagon: "rounded-none",
  shield: "rounded-none",
};

export const FRAME_CLASSES: Record<ProfilePhotoFrame, string> = {
  none: "",
  minimal: "ring-1 ring-slate-200 shadow-xs",
  emerald: "ring-2 ring-emerald-500 shadow-sm shadow-emerald-500/20",
  gradient: "p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-sky-500 shadow-sm",
  double: "ring-2 ring-slate-900 ring-offset-2 ring-offset-white shadow-sm",
  neon: "ring-2 ring-indigo-500 shadow-md shadow-indigo-500/30",
};

export const FILTER_CLASSES: Record<ProfilePhotoFilter, string> = {
  normal: "",
  crisp: "contrast-[1.15] saturate-[1.1]",
  warm: "sepia-[0.18] contrast-[1.05] brightness-[1.02]",
  noir: "grayscale contrast-[1.25]",
  cyber: "hue-rotate-[15deg] saturate-[1.35] contrast-[1.1]",
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = "User Avatar",
  size = "md",
  settings,
  className = "",
  imgClassName = "",
  fallbackText,
  badge,
  badgePosition = "bottom-right",
  onClick,
  title,
}) => {
  const [hasError, setHasError] = useState(false);

  const shape: ProfilePhotoShape = settings?.shape || "squircle";
  const frame: ProfilePhotoFrame = settings?.frame || "minimal";
  const filter: ProfilePhotoFilter = settings?.filter || "normal";
  const zoom: number = Math.max(0.8, Math.min(2.0, settings?.zoom || 1.0));

  const sizeStyles = typeof size === "string" && size in SIZE_MAP ? SIZE_MAP[size as AvatarSize] : null;
  const sizeClass = sizeStyles ? sizeStyles.container : size;
  const shapeRounded = SHAPE_ROUNDED_CLASSES[shape];
  const clipPath = SHAPE_CLIP_PATHS[shape];
  const frameClass = FRAME_CLASSES[frame];
  const filterClass = FILTER_CLASSES[filter];

  // Helper for fallback initials
  const initials = fallbackText
    ? fallbackText
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  const defaultPhoto = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80";
  const activeSrc = src && src.trim().length > 0 && !hasError ? src : defaultPhoto;

  const badgePositionClass = {
    "bottom-right": "-bottom-1 -right-1",
    "top-right": "-top-1 -right-1",
    "bottom-left": "-bottom-1 -left-1",
    "top-left": "-top-1 -left-1",
  }[badgePosition];

  const isGradient = frame === "gradient";

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeClass} ${className}`}
      onClick={onClick}
      title={title}
      style={{ cursor: onClick ? "pointer" : undefined }}
    >
      {/* Outer frame container */}
      <div
        className={`w-full h-full flex items-center justify-center overflow-hidden transition-all duration-200 ${shapeRounded} ${
          isGradient ? frameClass : ""
        } ${!isGradient ? frameClass : ""}`}
        style={clipPath ? { clipPath } : undefined}
      >
        {activeSrc ? (
          <img
            src={activeSrc}
            alt={alt}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover select-none transition-transform duration-200 ${shapeRounded} ${filterClass} ${imgClassName}`}
            style={{
              transform: zoom !== 1.0 ? `scale(${zoom})` : undefined,
              clipPath: clipPath ? clipPath : undefined,
            }}
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center bg-slate-900 text-white font-black uppercase tracking-wider ${shapeRounded}`}
            style={clipPath ? { clipPath } : undefined}
          >
            {initials ? (
              <span className={sizeStyles?.text || "text-xs"}>{initials}</span>
            ) : (
              <User className={sizeStyles?.icon || "w-4 h-4"} />
            )}
          </div>
        )}
      </div>

      {/* Optional Badge */}
      {badge && <div className={`absolute z-10 ${badgePositionClass}`}>{badge}</div>}
    </div>
  );
};
