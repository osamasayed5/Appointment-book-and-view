import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            {isSignUp ? "Create Account" : "Welcome Back!"}
          </CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            {isSignUp ? "Sign up to get started." : "Sign in to manage your appointments."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]} // No third-party providers unless specified
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(222.2 47.4% 11.2%)', // primary color
                    brandAccent: 'hsl(217.2 91.2% 59.8%)', // accent color
                  },
                },
              },
            }}
            theme="light"
            redirectTo={window.location.origin + '/'}
            view={isSignUp ? "sign_up" : "sign_in"} // Toggle between sign_in and sign_up
            showLinks={false} // Hide "Forgot your password?" and "Sign Up" links
          />
          <div className="mt-6 text-center">
            <Button variant="link" onClick={toggleAuthMode} className="p-0 h-auto">
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Sign up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;