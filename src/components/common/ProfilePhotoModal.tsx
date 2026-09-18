import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Upload,
  Link,
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
  ZoomIn,
  ZoomOut,
  Layers,
  Palette,
  Eye,
  Github,
  Video,
  VideoOff,
  Maximize2,
  Smile,
} from "lucide-react";
import {
  ProfilePhotoSettings,
  ProfilePhotoShape,
  ProfilePhotoFrame,
  ProfilePhotoFilter,
} from "../../types";
import { UserAvatar } from "./UserAvatar";

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhoto: string;
  currentSettings?: ProfilePhotoSettings;
  githubAvatarUrl?: string;
  githubUsername?: string;
  candidateName?: string;
  title?: string;
  subtitle?: string;
  onSave: (photoUrl: string, settings: ProfilePhotoSettings) => void;
}

const STUDIO_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80",
];

const SHAPE_OPTIONS: Array<{ id: ProfilePhotoShape; label: string; desc: string }> = [
  { id: "circle", label: "Circle", desc: "Classic round" },
  { id: "squircle", label: "Squircle", desc: "Apple curved" },
  { id: "rounded", label: "Rounded", desc: "Card format" },
  { id: "hexagon", label: "Hexagon", desc: "Tech polygon" },
  { id: "octagon", label: "Octagon", desc: "Executive cut" },
  { id: "shield", label: "Shield", desc: "Trust badge" },
];

const FRAME_OPTIONS: Array<{ id: ProfilePhotoFrame; label: string; desc: string }> = [
  { id: "none", label: "None", desc: "Clean borderless" },
  { id: "minimal", label: "Minimal", desc: "Subtle slate" },
  { id: "emerald", label: "Emerald", desc: "Verified accent" },
  { id: "gradient", label: "Gradient", desc: "Cyber neon" },
  { id: "double", label: "Double", desc: "High contrast" },
  { id: "neon", label: "Neon", desc: "Indigo aura" },
];

const FILTER_OPTIONS: Array<{ id: ProfilePhotoFilter; label: string; desc: string }> = [
  { id: "normal", label: "Natural", desc: "Original lighting" },
  { id: "crisp", label: "Crisp", desc: "Enhanced clarity" },
  { id: "warm", label: "Warm", desc: "Studio golden" },
  { id: "noir", label: "Noir", desc: "Executive B&W" },
  { id: "cyber", label: "Cyber", desc: "Vibrant cool" },
];

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
  isOpen,
  onClose,
  currentPhoto,
  currentSettings,
  githubAvatarUrl,
  githubUsername,
  candidateName = "Candidate",
  title,
  subtitle,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "webcam" | "url" | "presets" | "github">("upload");
  const [photoUrl, setPhotoUrl] = useState<string>(currentPhoto || STUDIO_PRESETS[0]);
  const [customUrlInput, setCustomUrlInput] = useState<string>("");

  // Photo Style Settings
  const [shape, setShape] = useState<ProfilePhotoShape>(currentSettings?.shape || "squircle");
  const [frame, setFrame] = useState<ProfilePhotoFrame>(currentSettings?.frame || "minimal");
  const [filter, setFilter] = useState<ProfilePhotoFilter>(currentSettings?.filter || "normal");
  const [zoom, setZoom] = useState<number>(currentSettings?.zoom || 1.0);

  // Webcam States
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync initial values on open
  useEffect(() => {
    if (isOpen) {
      setPhotoUrl(currentPhoto || STUDIO_PRESETS[0]);
      setShape(currentSettings?.shape || "squircle");
      setFrame(currentSettings?.frame || "minimal");
      setFilter(currentSettings?.filter || "normal");
      setZoom(currentSettings?.zoom || 1.0);
      setCameraActive(false);
      setCameraError(null);
    } else {
      stopCamera();
    }
  }, [isOpen, currentPhoto, currentSettings]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported by your browser.");
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: "user" },
          audio: false,
        });
      } catch {
        // Fallback to simple video constraint if facingMode or ideal dimensions fail
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn("Webcam access error:", err);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError" ||
        err.message?.toLowerCase().includes("permission")
      ) {
        setCameraError(
          "Camera access was blocked by your browser. Please click the lock/camera icon in your address bar (next to localhost:3000), set Camera to 'Allow', then click 'Retry Camera' below."
        );
      } else {
        setCameraError(err.message || "Failed to access camera. Check device permissions.");
      }
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw square cropped snapshot
    const minSide = Math.min(canvas.width, canvas.height);
    const startX = (canvas.width - minSide) / 2;
    const startY = (canvas.height - minSide) / 2;

    ctx.drawImage(video, startX, startY, minSide, minSide, 0, 0, minSide, minSide);
    const capturedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPhotoUrl(capturedDataUrl);
    stopCamera();
  };

  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setPhotoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    stopCamera();
    onSave(photoUrl, {
      shape,
      frame,
      filter,
      zoom,
    });
    onClose();
  };

  const handleReset = () => {
    setShape("squircle");
    setFrame("minimal");
    setFilter("normal");
    setZoom(1.0);
  };

  if (!isOpen) return null;

  const currentSettingsObj: ProfilePhotoSettings = {
    shape,
    frame,
    filter,
    zoom,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase tracking-tight text-white">
                  {title || "Customize Profile Photo"}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Universal Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {subtitle || "Choose photo, custom shape, frame border, and lighting filters visible to recruiters."}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Left Column: Live Multi-View Previews (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-slate-50/60 flex flex-col items-center justify-between gap-6">
            <div className="w-full text-center space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Live Interactive Preview
              </span>

              {/* Large Hero Preview */}
              <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center gap-3">
                <UserAvatar
                  src={photoUrl}
                  size="hero"
                  settings={currentSettingsObj}
                  fallbackText={candidateName}
                />
                <div className="text-center">
                  <h3 className="text-sm font-black text-slate-900">{candidateName}</h3>
                  <p className="text-[11px] font-semibold text-emerald-600">Candidate Profile View (Hero)</p>
                </div>
              </div>
            </div>

            {/* Other Viewport Simulated Previews */}
            <div className="w-full space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                How Others See Your Photo
              </span>
              <div className="grid grid-cols-2 gap-3 w-full">
                {/* Recruiter Pipeline Preview */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center gap-2 text-center">
                  <UserAvatar
                    src={photoUrl}
                    size="xl"
                    settings={currentSettingsObj}
                    fallbackText={candidateName}
                  />
                  <div>
                    <span className="text-[10px] font-black text-slate-800 block">Recruiter View</span>
                    <span className="text-[9px] text-slate-500">Pipeline Card (64px)</span>
                  </div>
                </div>

                {/* Header Navbar Preview */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center gap-2 text-center">
                  <UserAvatar
                    src={photoUrl}
                    size="sm"
                    settings={currentSettingsObj}
                    fallbackText={candidateName}
                  />
                  <div>
                    <span className="text-[10px] font-black text-slate-800 block">Header View</span>
                    <span className="text-[9px] text-slate-500">Compact Bar (32px)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Zoom Slider */}
            <div className="w-full bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Crop & Scale:</span>
                </span>
                <span className="font-mono text-emerald-600">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.8"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Right Column: Photo Source & Styling Controls (7 cols) */}
          <div className="lg:col-span-7 p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Source Tabs */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  1. Choose Photo Source
                </label>
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setActiveTab("upload");
                    }}
                    className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "upload"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("webcam");
                      startCamera();
                    }}
                    className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "webcam"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-sky-600" />
                    <span>Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setActiveTab("presets");
                    }}
                    className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "presets"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Smile className="w-3.5 h-3.5 text-amber-500" />
                    <span>Presets</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setActiveTab("url");
                    }}
                    className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "url"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Link className="w-3.5 h-3.5 text-purple-600" />
                    <span>Image URL</span>
                  </button>

                  {githubAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setActiveTab("github");
                        setPhotoUrl(githubAvatarUrl);
                      }}
                      className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === "github"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Github className="w-3.5 h-3.5 text-slate-900" />
                      <span>GitHub</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Source Tab Content Panel */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                {activeTab === "upload" && (
                  <div className="space-y-3 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) {
                          handleFileUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      className="p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-white hover:bg-emerald-50/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Click to browse or drag & drop photo
                        </span>
                        <span className="text-[10px] text-slate-400">
                          PNG, JPG, or WebP (instant client-side encoding)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "webcam" && (
                  <div className="space-y-3 text-center">
                    {cameraError ? (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs text-left space-y-2">
                        <div className="font-bold flex items-center gap-1.5 text-rose-900">
                          <VideoOff className="w-4 h-4 text-rose-600" />
                          <span>Camera Access Issue</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{cameraError}</p>
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retry Camera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("upload")}
                            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Or Upload from Files
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative w-48 h-48 bg-slate-900 rounded-2xl overflow-hidden shadow-inner border-2 border-slate-800">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          {!cameraActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                              <VideoOff className="w-6 h-6" />
                              <span className="text-[10px] font-bold">Camera is off</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!cameraActive ? (
                            <button
                              type="button"
                              onClick={startCamera}
                              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Video className="w-4 h-4" />
                              <span>Start Camera</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={capturePhoto}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer animate-pulse"
                              >
                                <Camera className="w-4 h-4" />
                                <span>Capture Snapshot</span>
                              </button>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                              >
                                Stop
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "presets" && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 block">
                      Choose from verified professional avatars:
                    </span>
                    <div className="grid grid-cols-4 gap-2.5">
                      {STUDIO_PRESETS.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPhotoUrl(preset)}
                          className={`relative rounded-xl overflow-hidden cursor-pointer aspect-square ring-2 transition-all ${
                            photoUrl === preset
                              ? "ring-emerald-500 scale-105 shadow-md"
                              : "ring-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img src={preset} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                          {photoUrl === preset && (
                            <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center text-white">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "url" && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 block">
                      Paste a direct image link:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://example.com/my-photo.jpg"
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customUrlInput.trim()) {
                            setPhotoUrl(customUrlInput.trim());
                          }
                        }}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "github" && githubAvatarUrl && (
                  <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <img
                        src={githubAvatarUrl}
                        alt="GitHub"
                        className="w-10 h-10 rounded-full border border-slate-300"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Verified GitHub Avatar
                        </span>
                        <span className="text-[10px] text-slate-500">@{githubUsername}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(githubAvatarUrl)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Use This</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Shape Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  2. Avatar Shape
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {SHAPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setShape(opt.id)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        shape === opt.id
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 bg-slate-800 ${
                          opt.id === "circle"
                            ? "rounded-full"
                            : opt.id === "squircle"
                            ? "rounded-[28%]"
                            : opt.id === "rounded"
                            ? "rounded-lg"
                            : ""
                        }`}
                        style={
                          opt.id === "hexagon"
                            ? { clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)" }
                            : opt.id === "octagon"
                            ? {
                                clipPath:
                                  "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                              }
                            : opt.id === "shield"
                            ? { clipPath: "polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)" }
                            : undefined
                        }
                      />
                      <span className="text-[11px] font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Border Accent Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  3. Frame & Accent Ring
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {FRAME_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFrame(opt.id)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        frame === opt.id
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          opt.id === "none"
                            ? "bg-slate-100 border border-slate-300"
                            : opt.id === "minimal"
                            ? "bg-slate-100 ring-1 ring-slate-400"
                            : opt.id === "emerald"
                            ? "bg-emerald-100 ring-2 ring-emerald-500"
                            : opt.id === "gradient"
                            ? "bg-gradient-to-tr from-emerald-500 via-teal-400 to-sky-500"
                            : opt.id === "double"
                            ? "bg-slate-900 ring-2 ring-slate-900 ring-offset-2"
                            : "bg-indigo-100 ring-2 ring-indigo-500 shadow-sm shadow-indigo-500/50"
                        }`}
                      />
                      <span className="text-[11px] font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Filter Presets */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  4. Studio Filter Lighting
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFilter(opt.id)}
                      className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        filter === opt.id
                          ? "bg-slate-900 text-white border-slate-900 font-black shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 font-bold text-xs"
                      }`}
                    >
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
