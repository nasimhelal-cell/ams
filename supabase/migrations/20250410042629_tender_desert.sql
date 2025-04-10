/*
  # Initial Schema Setup for Attendance System

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `designation` (text)
      - `face_descriptors` (jsonb array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `attendance_logs`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key)
      - `check_in` (timestamp)
      - `check_out` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  designation text NOT NULL,
  face_descriptors jsonb[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendance_logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) NOT NULL,
  check_in timestamptz NOT NULL DEFAULT now(),
  check_out timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Policies for employees table
CREATE POLICY "Employees can view their own data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Employees can update their own data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policies for attendance_logs table
CREATE POLICY "Employees can view their own attendance"
  ON attendance_logs
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "System can insert attendance logs"
  ON attendance_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "System can update attendance logs"
  ON attendance_logs
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid());