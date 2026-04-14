-- Migration: Add new columns to visitas table
-- Run this in Supabase SQL editor if the columns don't exist yet

ALTER TABLE visitas
  ADD COLUMN IF NOT EXISTS usuario_nombre VARCHAR(255),
  ADD COLUMN IF NOT EXISTS observaciones TEXT,
  ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS fecha_finalizacion TIMESTAMP,
  ADD COLUMN IF NOT EXISTS grupo_whatsapp VARCHAR(255),
  ADD COLUMN IF NOT EXISTS enviada_whatsapp BOOLEAN DEFAULT FALSE;

-- Create storage bucket for photos (run in Supabase dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-gondola', 'fotos-gondola', true)
-- ON CONFLICT (id) DO NOTHING;
