-- Supabase Database Schema for Portfolio Admin
-- Run this SQL in Supabase Dashboard > SQL Editor

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  behance_url TEXT,
  fields TEXT[],
  appreciations INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_hero BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table  
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project images (gallery)
CREATE TABLE IF NOT EXISTS project_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public read services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Public read images" ON project_images FOR SELECT USING (true);

-- Admin write access (authenticated users)
CREATE POLICY "Admin insert projects" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update projects" ON projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete projects" ON projects FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert services" ON services FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update services" ON services FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete services" ON services FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert images" ON project_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin delete images" ON project_images FOR DELETE USING (auth.role() = 'authenticated');

-- Storage bucket for project images
-- Run in Supabase Dashboard > Storage > Create a new bucket named 'project-images' (public)
-- Then run these policies in SQL Editor:

-- Public read access for storage
CREATE POLICY "Public read storage images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

-- Admin upload access for storage
CREATE POLICY "Admin upload storage images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images' AND auth.role() = 'authenticated');

-- Admin delete access for storage
CREATE POLICY "Admin delete storage images"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-images' AND auth.role() = 'authenticated');
