import React from 'react';

interface LoadingOverlayProps {
  text: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ text }) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-blue-500"></div>
      <p className="text-center text-lg font-medium text-white">{text}</p>
    </div>
  );
};