import React from 'react';
import './ShareTooltipButton.css';

interface ShareTooltipButtonProps {
  url?: string;
  text?: string;
}

export const ShareTooltipButton: React.FC<ShareTooltipButtonProps> = ({ url, text }) => {
  // Fallback to current page URL and a generic message
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = text || 'Check this out!';

  // Social share links
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;

  return (
    <div className="tooltip-container">
      <div className="button-content">
        <span className="text">Share</span>
        <svg
          className="share-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
        >
          <path
            d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
          ></path>
        </svg>
      </div>
      <div className="tooltip-content">
        <div className="social-icons">
          <a href={twitterUrl} className="social-icon twitter" aria-label="Share on Twitter" target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
          </a>
          <a href={facebookUrl} className="social-icon facebook" aria-label="Share on Facebook" target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          <a href={linkedinUrl} className="social-icon linkedin" aria-label="Share on LinkedIn" target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a href={whatsappUrl} className="social-icon whatsapp" aria-label="Share on WhatsApp" target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24">
              <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.832 4.584 2.236 6.393L4 29l7.824-2.05A12.94 12.94 0 0016 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22.917c-2.021 0-3.98-.594-5.637-1.715l-.403-.257-4.646 1.217 1.24-4.527-.263-.415A9.93 9.93 0 016 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.29-7.348c-.29-.145-1.715-.847-1.98-.944-.265-.097-.458-.145-.65.146-.19.29-.747.944-.915 1.14-.168.194-.337.218-.627.073-.29-.145-1.225-.452-2.334-1.44-.863-.77-1.445-1.72-1.615-2.01-.168-.29-.018-.447.127-.592.13-.13.29-.337.435-.505.145-.168.193-.29.29-.484.097-.194.048-.364-.024-.51-.073-.145-.65-1.57-.89-2.15-.235-.565-.475-.488-.65-.497l-.555-.01c-.19 0-.497.073-.757.364-.26.29-.99.97-.99 2.36 0 1.39 1.012 2.73 1.153 2.92.145.194 1.99 3.04 4.825 4.145.675.29 1.2.464 1.61.594.676.215 1.29.185 1.775.112.54-.08 1.715-.7 1.96-1.376.242-.677.242-1.257.17-1.376-.073-.12-.265-.193-.555-.338z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}; 