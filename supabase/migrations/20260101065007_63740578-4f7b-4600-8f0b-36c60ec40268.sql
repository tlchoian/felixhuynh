-- Allow anon role to insert tasks (for external webhook integration)
CREATE POLICY "Anon can insert tasks for webhook" 
ON public.tasks 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Allow anon role to select tasks (for external webhook integration)
CREATE POLICY "Anon can select tasks for webhook" 
ON public.tasks 
FOR SELECT 
TO anon
USING (true);