import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymcczyecixyalxfbxtxf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltY2N6eWVjaXh5YWx4ZmJ4dHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NDM4NjgsImV4cCI6MjEwNTAxOTg2OH0.peWBZxfuCMuiBPGf3OGrjzMSx60WvKLD7OIO_K7RsxY';

export const supabase = createClient(supabaseUrl, supabaseKey);
