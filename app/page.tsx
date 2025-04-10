import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, UserCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
            Face Recognition Attendance System
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Streamline your attendance tracking with our advanced facial recognition system.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/signup">
              <Button size="lg">Sign Up</Button>
            </Link>
            <Link href="/attendance">
              <Button variant="outline" size="lg">
                Mark Attendance
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Easy Registration
              </CardTitle>
              <CardDescription>
                Quick and secure employee registration process
              </CardDescription>
            </CardHeader>
            <CardContent>
              Register with basic information and facial data for seamless authentication.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-6 w-6" />
                Automatic Recognition
              </CardTitle>
              <CardDescription>
                Advanced facial recognition technology
              </CardDescription>
            </CardHeader>
            <CardContent>
              Simply face the camera to mark your attendance automatically.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Real-time Tracking
              </CardTitle>
              <CardDescription>
                Instant attendance logging
              </CardDescription>
            </CardHeader>
            <CardContent>
              Track attendance records in real-time with detailed reporting.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}