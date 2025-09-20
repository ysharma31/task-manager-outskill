/*
  # Setup profiles table trigger for automatic profile creation

  1. Trigger Function
    - Creates a trigger function that automatically creates a profile when a new user signs up
    - Extracts full_name from user metadata and creates profile entry

  2. Trigger
    - Attaches the function to the auth.users table
    - Fires after each user insertion
*/

-- Create trigger function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that calls the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();