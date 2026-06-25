// pages/_app.js
import { AuthProvider } from "../contexts/AuthContext";
import { EditorProvider } from "../contexts/EditorContext";
import "../styles/globals.css";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { usePermissions } from '../src/contexts/PermissionsContext';
import { PermissionsProvider } from "../src/contexts/PermissionsContext";
import OnlineStatusToaster from "../components/OnlineStatusToaster";
import OfflineBanner from "../components/OfflineBanner";
import QueueDashboard from "../components/QueueDashboard";
import "leaflet/dist/leaflet.css";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // ✅ Sopprimi AuthSessionMissingError dalla console
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const msg = args[0]?.message || args[0] || '';
      if (
        msg.includes?.('Auth session missing') ||
        String(msg).includes('Auth session missing')
      ) {
        return; // ✅ ignora silenziosamente
      }
      originalConsoleError(...args);
    };
  
    const handleUnhandledRejection = (event) => {
      if (
        event.reason?.message?.includes('Auth session missing') || 
        event.reason?.message?.includes('session_not_found')
      ) {
        event.preventDefault();
      }
    };
    
    const handleError = (event) => {
      if (
        event.error?.message?.includes('Auth session missing') ||
        event.message?.includes('Auth session missing')
      ) {
        event.preventDefault();
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    
    return () => {
      console.error = originalConsoleError; // ✅ ripristina al cleanup
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  return (
    <AuthProvider>
       {/* ✅ Aggiungi PermissionsProvider qui */}
       <PermissionsProvider>
      <EditorProvider>
        <OnlineStatusToaster />
        <OfflineBanner />
        <QueueDashboard />
        <Component {...pageProps} />
        
        <Toaster
          position="top-center"
          containerStyle={{
            top: "50%",
            transform: "translateY(-50%)",
          }}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#fff",
              color: "#222",
              fontWeight: 500,
              borderRadius: "10px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
              padding: "14px 18px",
            },
            success: {
              icon: "✅",
              style: { borderLeft: "5px solid #16a34a" },
            },
            error: {
              icon: "❌",
              style: { borderLeft: "5px solid #dc2626" },
            },
            info: {
              icon: "ℹ️",
              style: { borderLeft: "5px solid #3b82f6" },
            },
          }}
        />
      </EditorProvider>
      </PermissionsProvider>
      {/* ✅ Fine PermissionsProvider */}
    </AuthProvider>
  );
}