"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  designation: string;
  createdAt: string;
  faceImages: {
    id: string;
    imagePath: string;
  }[];
}

export default function AttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [detectionStarted, setDetectionStarted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<{
    status: "success" | "error" | null;
    message: string;
    userName?: string;
  }>({ status: null, message: "" });

  const { toast } = useToast();

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";

      try {
        console.log("Loading models from", window.location.origin + MODEL_URL);

        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        console.log("Models loaded successfully");
      } catch (error) {
        console.error("Error loading models:", error);
        toast({
          title: "Error",
          description: "Failed to load face recognition models",
          variant: "destructive",
        });
      }
    };

    loadModels();

    // Fetch users
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [toast]);

  // Setup camera with enhanced error handling and initialization
  const startCamera = async () => {
    console.log("Starting camera...");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser doesn't support camera access");
      }

      // Clear any previous stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      console.log("Requesting camera access...");
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true, // Use simpler constraints first
      });

      console.log("Camera access granted, setting up video element");

      if (videoRef.current) {
        // Directly set srcObject and play
        videoRef.current.srcObject = newStream;

        // Create a promise to ensure video plays
        await new Promise((resolve, reject) => {
          if (!videoRef.current) return reject("Video element not available");

          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(resolve).catch(reject);
          };

          // Add a timeout in case the metadata event doesn't fire
          setTimeout(() => reject("Video load timeout"), 5000);
        });

        console.log("Video playing successfully");
        setStream(newStream);
      } else {
        throw new Error("Video element not available");
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      let errorMessage = "Could not access camera";

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          errorMessage =
            "Camera access denied. Please allow camera permission.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera found on your device.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application.";
        } else {
          errorMessage = `Camera error: ${error.name}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
      setDetectionStarted(false);
    }
  };

  // Load labeled face descriptions for all users
  const loadLabeledFaceDescriptors = async () => {
    try {
      console.log("Starting to load face descriptors for users...");

      const labeledDescriptors = await Promise.all(
        users.map(async (user) => {
          // Only process if user has face images
          if (user.faceImages.length === 0) {
            console.log(`User ${user.name} has no face images`);
            return null;
          }

          console.log(
            `Processing ${user.faceImages.length} images for user ${user.name}`
          );

          const descriptions = await Promise.all(
            user.faceImages.map(async (faceImage, index) => {
              try {
                console.log(
                  `Loading image ${index + 1}/${user.faceImages.length} from: ${
                    faceImage.imagePath
                  }`
                );

                const img = await faceapi.fetchImage(faceImage.imagePath);

                // Try with lower minConfidence (0.3 instead of default 0.5)
                const detection = await faceapi
                  .detectSingleFace(
                    img,
                    new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 })
                  )
                  .withFaceLandmarks()
                  .withFaceDescriptor();

                if (!detection) {
                  console.log(
                    `No face detected in image ${index + 1} for user: ${
                      user.name
                    }. Check image quality.`
                  );
                  return null;
                }

                console.log(
                  `Successfully extracted face descriptor for ${
                    user.name
                  } (image ${index + 1})`
                );
                return detection.descriptor;
              } catch (error) {
                console.error(
                  `Error processing image ${faceImage.imagePath} for user ${user.name}:`,
                  error
                );
                return null;
              }
            })
          );

          // Filter out null descriptions
          const validDescriptions = descriptions.filter(
            (desc) => desc !== null
          ) as Float32Array[];

          if (validDescriptions.length === 0) {
            console.log(
              `No valid face descriptors found for user: ${user.name}`
            );
            return null;
          }

          console.log(
            `Created face descriptor for ${user.name} with ${validDescriptions.length} valid images`
          );
          return new faceapi.LabeledFaceDescriptors(user.id, validDescriptions);
        })
      );

      // Filter out null labeled descriptors
      const validLabeledDescriptors = labeledDescriptors.filter(
        (desc) => desc !== null
      ) as faceapi.LabeledFaceDescriptors[];

      console.log(
        `Loaded face descriptors for ${validLabeledDescriptors.length} users`
      );
      return validLabeledDescriptors;
    } catch (error) {
      console.error("Error loading face descriptors:", error);
      toast({
        title: "Error",
        description: "Failed to process face data",
        variant: "destructive",
      });
      return [];
    }
  };

  // Start face detection and recognition
  const startDetection = async () => {
    if (!modelsLoaded || !videoRef.current || !users.length) {
      toast({
        title: "Not Ready",
        description: "Face recognition models or user data not loaded yet",
        variant: "destructive",
      });
      return;
    }

    setDetectionStarted(true);
    setProcessing(true);
    setAttendanceStatus({ status: null, message: "" });

    try {
      // Load labeled face descriptors for all users
      const labeledFaceDescriptors = await loadLabeledFaceDescriptors();

      if (labeledFaceDescriptors.length === 0) {
        toast({
          title: "Error",
          description: "No valid face data available for comparison",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Create face matcher with labeled descriptors
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

      // Give time for camera to initialize
      setTimeout(async () => {
        if (!videoRef.current || !canvasRef.current) {
          setProcessing(false);
          return;
        }

        // Get face detection from video
        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptors();

        // Draw detections on canvas
        const displaySize = {
          width: videoRef.current.width,
          height: videoRef.current.height,
        };

        faceapi.matchDimensions(canvasRef.current, displaySize);

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        // Clear previous drawings
        const ctx = canvasRef.current.getContext("2d");
        if (ctx)
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );

        // Draw boxes and labels
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);

        // Match detected faces to labeled descriptors
        if (detections.length > 0) {
          let matchFound = false;

          for (const detection of detections) {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

            if (bestMatch.label !== "unknown") {
              const matchedUser = users.find(
                (user) => user.id === bestMatch.label
              );

              if (matchedUser) {
                matchFound = true;

                console.log("matchedUser", matchedUser);
                // Log when a registered user is found
                console.log(`Found registered user: ${matchedUser.name}`);

                // Set success status
                setAttendanceStatus({
                  status: "success",
                  message: "Attendance Marked Successfully!",
                  userName: matchedUser.name,
                });

                // You can add API call here to record attendance in the database

                break;
              }
            }
          }

          if (!matchFound) {
            setAttendanceStatus({
              status: "error",
              message: "Face not recognized. Please try again.",
            });
          }
        } else {
          setAttendanceStatus({
            status: "error",
            message: "No face detected. Please position yourself properly.",
          });
        }

        setProcessing(false);
      }, 1000);
    } catch (error) {
      console.error("Error in face detection:", error);
      setProcessing(false);
      toast({
        title: "Error",
        description: "Face detection failed",
        variant: "destructive",
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (loadingUsers || !modelsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-2">Loading resources...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Face Attendance System
      </h1>

      <div className="flex items-center justify-center">
        <div className="relative mb-6">
          <video
            ref={videoRef}
            width="640"
            height="480"
            autoPlay
            playsInline
            muted
            className={`border rounded-lg ${!stream ? "bg-gray-200" : ""}`}
          />
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            className="absolute top-0 left-0 z-10"
          />

          {!stream && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70 rounded-lg">
              <p>Camera is off</p>
            </div>
          )}

          {processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        <div className="space-x-4 mb-6">
          {!stream ? (
            <button
              onClick={() => {
                console.log("Camera button clicked");
                startCamera();
              }}
              className={`px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition ${
                processing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
              disabled={processing}
            >
              Turn On Camera
            </button>
          ) : (
            <>
              <button
                onClick={stopCamera}
                className={`px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition ${
                  processing
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                disabled={processing}
              >
                Turn Off Camera
              </button>

              <button
                onClick={startDetection}
                className={`px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition ${
                  processing || !stream
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                disabled={processing || !stream}
              >
                {processing ? "Processing..." : "Mark Attendance"}
              </button>
            </>
          )}
        </div>

        {attendanceStatus.status && (
          <div
            className={`mt-4 p-4 rounded-lg text-center ${
              attendanceStatus.status === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            <p className="text-lg font-medium">{attendanceStatus.message}</p>
            {attendanceStatus.userName && (
              <p className="text-md">Welcome, {attendanceStatus.userName}!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
