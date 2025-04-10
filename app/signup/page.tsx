"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  designation: z.string().min(2, "Designation must be at least 2 characters"),
});

export default function SignUp() {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const webcamRef = React.useRef<Webcam>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");

  // Get available cameras
  React.useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error getting cameras:", err);
        setCameraError("Unable to access camera list");
      }
    };

    // First check if we have permission
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        getCameras();
      })
      .catch((err) => {
        console.error("Camera permission error:", err);
        setCameraError(
          "Camera permission denied. Please allow camera access in your browser settings."
        );
      });
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      designation: "",
    },
  });

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImages((prev) => [...prev, imageSrc]);
      }
    }
  };

  const handleCameraError = (err: string | DOMException) => {
    console.error("Camera error:", err);
    setCameraError(
      typeof err === "string" ? err : "Camera error: " + err.message
    );
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (capturedImages.length < 10) {
      alert("Please capture at least 10 images");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate a unique user ID
      const userId = crypto.randomUUID();

      // 1. Save the facial recognition images to local storage
      const imageUploadPromises = capturedImages.map(async (image, index) => {
        // Convert base64 image to blob
        const blob = await fetch(image).then((res) => res.blob());

        // Create a FormData object to send the image to our API route
        const formData = new FormData();
        formData.append("image", blob, `${index}.jpg`);
        formData.append("userId", userId);

        // Upload the image using our API route
        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();
        return data.filePath;
      });

      const uploadedPaths = await Promise.all(imageUploadPromises);

      // 2. Store user data in SQLite database
      const response = await fetch("/api/register-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
          name: values.name,
          email: values.email,
          password: values.password, // Note: In production, hash this on server side
          designation: values.designation,
          faceImagePaths: uploadedPaths,
          createdAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      // 3. Redirect to success page or dashboard
      router.push("/attendance");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Employee Registration</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Facial Recognition Setup
              </h2>
              {/* Add tips for better face detection */}
              <div className="mt-2 p-3 bg-blue-50 text-blue-800 rounded-md max-w-lg mx-auto">
                <h3 className="font-semibold text-sm">
                  📸 Tips for Better Face Detection:
                </h3>
                <ul className="text-xs mt-1 list-disc pl-4">
                  <li>
                    When storing face images, capture from slightly different
                    angles (front, slight left/right)
                  </li>
                  <li>
                    Ensure good lighting on your face with no harsh shadows
                  </li>
                  <li>
                    Keep a neutral expression and remove glasses if possible
                  </li>
                  <li>
                    Maintain proper distance from camera (not too close or far)
                  </li>
                </ul>
              </div>

              {cameras.length > 1 && (
                <div className="mb-3">
                  <FormLabel>Select Camera</FormLabel>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                  >
                    {cameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label ||
                          `Camera ${camera.deviceId.slice(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {cameraError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                  <p className="font-medium">Camera Error</p>
                  <p>{cameraError}</p>
                  <p className="text-sm mt-2">
                    Please make sure you have allowed camera permissions in your
                    browser.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full rounded-lg"
                    videoConstraints={{
                      deviceId: selectedCamera || undefined,
                      facingMode: selectedCamera ? undefined : "user",
                      width: 640,
                      height: 480,
                    }}
                    onUserMediaError={handleCameraError}
                  />
                  <Button
                    type="button"
                    onClick={captureImage}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                    disabled={!webcamRef.current}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Capture Image ({capturedImages.length}/10)
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {capturedImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Captured ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register"}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
