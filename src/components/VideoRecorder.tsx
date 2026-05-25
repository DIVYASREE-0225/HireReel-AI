import React, { useRef, useState, useEffect } from "react";
import { Camera, StopCircle, RefreshCw, Upload, Check, Video, AlertTriangle, UploadCloud, FileVideo } from "lucide-react";

interface VideoRecorderProps {
  onUploadSuccess: (videoURL: string) => void;
  onClose: () => void;
  token: string;
}

export default function VideoRecorder({ onUploadSuccess, onClose, token }: VideoRecorderProps) {
  const [activeTab, setActiveTab] = useState<"record" | "upload">("upload"); // Default to upload to bypass immediate block, or let user switch
  
  // Webcam recorder states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  // Manual file upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // General helper states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer loop for recording counts
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 60) { // Limit to 60 seconds
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Handle active stream toggling depending on active tab selection
  useEffect(() => {
    if (activeTab === "record") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  async function startCamera() {
    setErrorMessage(null);
    setVideoUrl(null);
    setRecordedChunks([]);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera Access Error:", err);
      setErrorMessage(
        "Could not access camera/microphone inside this browser preview. For a hassle-free experience, please use the 'Upload Video File' tab to instantly supply your pre-recorded elevator pitch!"
      );
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }

  function startRecording() {
    if (!stream) return;
    setRecordedChunks([]);
    setVideoUrl(null);
    setSeconds(0);

    const options = { mimeType: "video/webm;codecs=vp8" };
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, options);
    } catch (e) {
      // Fallback for Safari / mobile devices
      recorder = new MediaRecorder(stream);
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    recorder.onstop = () => {
      // Create final file from accumulated chunks
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    };

    mediaRecorderRef.current = recorder;
    recorder.start(10); // Accumulate pieces
    setIsRecording(true);
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  // File manual upload helpers
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  }

  function processSelectedFile(file: File) {
    if (!file.type.startsWith("video/")) {
      setErrorMessage("Unsupported file class. Please select an eligible video file (.mp4, .webm, .mov).");
      return;
    }
    // Check 40MB limit
    if (file.size > 40 * 1024 * 1024) {
      setErrorMessage("Video exceeds our safe limit of 40MB. Please use a compressed or shorter recording.");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragActive(false);
    setErrorMessage(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  }

  // Unified base64 file upload server proxy driver
  async function handleUploadFinal(fileDataUrl: string) {
    setIsUploading(true);
    setUploadProgress("Encoding resume resource package...");

    try {
      const response = await fetch("/api/upload-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ videoBase64: fileDataUrl })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Server could not finalize video registry.");
      }

      setUploadProgress("Video resume published successfully!");
      setTimeout(() => {
        onUploadSuccess(data.videoURL);
      }, 1000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadProgress("");
      setErrorMessage(err.message || "Failed to commit video file to backup disk.");
      setIsUploading(false);
    }
  }

  // Initiate reading camera recording or raw uploaded file as base64
  async function handleSaveAction() {
    if (activeTab === "record") {
      if (recordedChunks.length === 0) return;
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        handleUploadFinal(reader.result as string);
      };
    } else {
      if (!selectedFile) return;
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = () => {
        handleUploadFinal(reader.result as string);
      };
    }
  }

  function resetSelection() {
    setErrorMessage(null);
    setUploadProgress("");
    if (activeTab === "record") {
      setVideoUrl(null);
      setRecordedChunks([]);
      setSeconds(0);
      startCamera();
    } else {
      setSelectedFile(null);
      setFilePreviewUrl(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-600 animate-pulse" />
              <h3 className="font-display font-bold text-lg text-slate-900">
                Setup Video Presentation Resume
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Deliver your pitch to potential technical recruiters.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-200/50 rounded-lg text-sm self-start sm:self-center"
          >
            ✕ Close
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
          <button
            onClick={() => setActiveTab("upload")}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "upload"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-100"
                : "text-slate-500 hover:bg-white/50"
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Video File (Recommended Fallback)
          </button>
          
          <button
            onClick={() => setActiveTab("record")}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "record"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-100"
                : "text-slate-500 hover:bg-white/50"
            }`}
          >
            <Camera className="w-4 h-4" />
            Record Live Webcam
          </button>
        </div>

        {/* Preview / Work Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          
          {/* TAB 1: UPLOAD COMPONENT */}
          {activeTab === "upload" && (
            <div className="w-full h-full flex items-center justify-center text-center p-6">
              {filePreviewUrl ? (
                <video
                  src={filePreviewUrl}
                  controls
                  playsInline
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all ${
                    isDragActive
                      ? "border-indigo-600 bg-indigo-50/10 text-indigo-300"
                      : "border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <UploadCloud className="w-12 h-12 text-indigo-500 mb-3 animate-bounce" />
                  <span className="font-bold text-white text-sm block">
                    Drag and drop pre-recorded resume video here
                  </span>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-[340px] leading-relaxed">
                    Eligible formats include MP4, WEBM, and MOV (max size 40MB). Camera access problems? record on your phone and import file directly!
                  </p>

                  <label className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/10">
                    Browse Local Files
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STREAM RECORD COMPONENT */}
          {activeTab === "record" && (
            <div className="w-full h-full flex items-center justify-center text-center">
              {errorMessage ? (
                <div className="text-center p-6 max-w-sm">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-pulse" />
                  <p className="text-white text-xs font-semibold leading-relaxed">{errorMessage}</p>
                  <button
                    onClick={() => {
                      setActiveTab("upload"); // Switch seamlessly to recommended upload mode
                    }}
                    className="mt-4 bg-indigo-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition"
                  >
                    Switch to Manual Video Upload
                  </button>
                </div>
              ) : !videoUrl ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}

              {/* Floating Recording Banner */}
              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  REC 00:{seconds < 10 ? `0${seconds}` : seconds}
                </div>
              )}
            </div>
          )}

          {/* Floating diagnostic overlay warning for camera block if any */}
          {errorMessage && activeTab === "upload" && (
            <div className="absolute bottom-4 left-4 right-4 bg-amber-500/10 border border-amber-500/20 backdrop-blur-md text-amber-300 text-[11px] p-2 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Action Controls bar */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-center gap-3">
            
            {activeTab === "record" ? (
              // Webcam flow buttons
              !videoUrl ? (
                !isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!!errorMessage}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all text-sm cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Start Webcam Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-red-600/20 active:scale-95 transition-all text-sm cursor-pointer"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop Recording
                  </button>
                )
              ) : (
                // Review Webcam Stream state
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetSelection}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold px-5 py-3 rounded-2xl active:scale-95 transition-all text-sm cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Re-Record
                  </button>
                  <button
                    onClick={handleSaveAction}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all text-sm cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Uploading webm...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Apply Live Video Resume
                      </>
                    )}
                  </button>
                </div>
              )
            ) : (
              // File input upload flow buttons
              filePreviewUrl ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetSelection}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold px-5 py-3 rounded-2xl active:scale-95 transition-all text-sm cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Select Different File
                  </button>
                  <button
                    onClick={handleSaveAction}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all text-sm cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Uploading video resource...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Save & Apply Video File
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium font-mono uppercase bg-slate-100 px-4 py-2 rounded-xl">
                  Waiting for Video File Selection...
                </p>
              )
            )}
          </div>

          {/* Progress Indication bar */}
          {isUploading && (
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1 relative">
              <div className="bg-indigo-600 h-full w-3/4 rounded-full animate-pulse"></div>
            </div>
          )}
          {uploadProgress && (
            <p className="text-center font-mono text-xs text-indigo-700 font-bold">
              ✨ {uploadProgress}
            </p>
          )}

          <div className="text-center pt-2 border-t border-slate-200/50">
            <p className="text-[10px] text-slate-500 leading-normal max-w-lg mx-auto">
              💡 <strong>Hiring Hint:</strong> Ensure your video concisely communicates your expertise, portfolio accomplishments, and workspace availability!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
