"use client";

import { useEffect, useRef } from 'react';
import type { MockUser } from '@/types';

interface NetworkGraphProps {
  currentUser: MockUser;
  followedUsers: MockUser[];
  mutualConnections: {[userId: string]: MockUser[]};
}

export function NetworkGraph({
  currentUser,
  followedUsers,
  mutualConnections
}: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Helper function to draw a node
    function drawNode(
      x: number, 
      y: number, 
      label: string, 
      isPrimary: boolean
    ) {
      if (!ctx) return;
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, isPrimary ? 30 : 20, 0, 2 * Math.PI);
      ctx.fillStyle = isPrimary ? 'rgba(79, 70, 229, 0.8)' : 'rgba(79, 70, 229, 0.6)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label
      ctx.font = isPrimary ? '12px Arial' : '10px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Truncate long labels
      const maxChars = isPrimary ? 12 : 8;
      const displayLabel = label.length > maxChars ? `${label.substring(0, maxChars)}...` : label;
      
      ctx.fillText(displayLabel, x, y);
    }
    
    // Draw the network
    function drawNetwork() {
      if (!ctx || !canvas) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Define node positions
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.35;
      
      // Draw current user node in the center
      drawNode(centerX, centerY, currentUser.username, true);
        // Draw followed users in a circle around the current user
      const followedPositions: {[userId: string]: {x: number, y: number}} = {};
      
      followedUsers.forEach((user, index) => {
        const angle = (index * 2 * Math.PI) / followedUsers.length;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        // Draw connection line to current user
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        
        // Draw the node
        drawNode(x, y, user.username, false);
        followedPositions[user.id] = { x, y };
      });
      
      // Draw connections between followed users based on mutual connections
      Object.entries(mutualConnections).forEach(([userId, mutuals]) => {
        const userPosition = followedPositions[userId];
        if (!userPosition || !ctx) return;
        
        mutuals.forEach(mutual => {
          const mutualPosition = followedPositions[mutual.id];
          if (mutualPosition && userId < mutual.id) { // Prevent drawing lines twice
            ctx.beginPath();
            ctx.moveTo(userPosition.x, userPosition.y);
            ctx.lineTo(mutualPosition.x, mutualPosition.y);
            ctx.strokeStyle = 'rgba(100, 100, 255, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
    }
      // Set canvas to be responsive
    function resize() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      drawNetwork();
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    // Clean up event listener
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [currentUser, followedUsers, mutualConnections]);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: '100%', height: '100%' }}
    />
  );
}
