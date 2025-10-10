"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Youtube, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface YouTubeConnectButtonProps {
  userId: string;
  onConnectionChange?: (connected: boolean) => void;
  className?: string;
}

interface ConnectionStatus {
  connected: boolean;
  connected_at?: string;
  provider_user_email?: string;
  needs_refresh?: boolean;
}

export function YouTubeConnectButton({
  userId,
  onConnectionChange,
  className = "",
}: YouTubeConnectButtonProps) {
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check connection status on mount and after callback
  useEffect(() => {
    checkConnectionStatus();
    
    // Handle OAuth callback success/error
    const params = new URLSearchParams(window.location.search);
    if (params.get("youtube_connected") === "true") {
      toast({
        title: "YouTube Connected!",
        description: "Your YouTube account has been successfully connected.",
      });
      // Clean up URL params
      window.history.replaceState({}, "", window.location.pathname);
      checkConnectionStatus(); // Refresh status
    } else if (params.get("youtube_error")) {
      const errorMsg = params.get("youtube_error") || "Failed to connect";
      toast({
        title: "Connection Failed",
        description: errorMsg,
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Notify parent of connection changes
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(status.connected);
    }
  }, [status.connected, onConnectionChange]);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:8000/api/v1/auth/youtube/status/${userId}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to check status: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatus(data);
      
      // Auto-refresh if token needs refresh
      if (data.needs_refresh) {
        await handleRefreshToken();
      }
    } catch (err) {
      console.error("Failed to check YouTube connection status:", err);
      setError(err instanceof Error ? err.message : "Failed to check connection");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:8000/api/v1/auth/youtube/connect?user_id=${userId}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to initiate connection: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Redirect to Google OAuth consent screen
      window.location.href = data.authorization_url;
    } catch (err) {
      console.error("Failed to connect YouTube:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      toast({
        title: "Connection Error",
        description: "Failed to start YouTube connection. Please try again.",
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your YouTube account?")) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:8000/api/v1/auth/youtube/disconnect/${userId}`,
        { method: "POST" }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to disconnect: ${response.statusText}`);
      }
      
      toast({
        title: "YouTube Disconnected",
        description: "Your YouTube account has been disconnected.",
      });
      
      setStatus({ connected: false });
    } catch (err) {
      console.error("Failed to disconnect YouTube:", err);
      setError(err instanceof Error ? err.message : "Failed to disconnect");
      toast({
        title: "Disconnect Error",
        description: "Failed to disconnect YouTube. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/auth/youtube/refresh/${userId}`,
        { method: "POST" }
      );
      
      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }
      
      // Recheck status after refresh
      await checkConnectionStatus();
    } catch (err) {
      console.error("Failed to refresh YouTube token:", err);
      // Don't show error to user, just mark as needs reconnection
      setStatus({ connected: false });
    }
  };

  // Loading state
  if (loading && !connecting) {
    return (
      <Button disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking...
      </Button>
    );
  }

  // Connected state
  if (status.connected) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-green-50 border-green-200 hover:bg-green-100"
            disabled
          >
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
            <span className="text-green-700">YouTube Connected</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Disconnect
          </Button>
        </div>
        
        {status.provider_user_email && (
          <p className="text-xs text-muted-foreground">
            Connected as: {status.provider_user_email}
          </p>
        )}
        
        {status.needs_refresh && (
          <Alert variant="default" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Token needs refresh. It will be refreshed automatically.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Not connected state
  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        onClick={handleConnect}
        disabled={connecting}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        {connecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Youtube className="mr-2 h-4 w-4" />
            Connect YouTube
          </>
        )}
      </Button>
      
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      
      <p className="text-xs text-muted-foreground">
        Connect your YouTube account for personalized video recommendations
      </p>
    </div>
  );
}
