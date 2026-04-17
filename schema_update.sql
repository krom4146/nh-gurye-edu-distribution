-- 1. Add outing time columns to site_settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS outing_start_time TEXT DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS outing_end_time TEXT DEFAULT '22:55';

-- 2. Ensure stay_requests has delete policy for the reset button
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stay_requests' AND policyname = 'Enable delete access for all users'
    ) THEN
        CREATE POLICY "Enable delete access for all users" ON stay_requests FOR DELETE USING (true);
    END IF;
END $$;
