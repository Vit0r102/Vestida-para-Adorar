//=============================
//configuraçoes do supabase
//============================= 

const supabaseUrl = 'https://tuwlwrzfaufxocpsehvh.supabase.co';

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1d2x3cnpmYXVmeG9jcHNlaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjAxMzQsImV4cCI6MjA5NTk5NjEzNH0.dbNVof1cru7FqFhP5RdmWgMy-SbRq8R2ykZMfa64Ut8';

const supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);
