/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',  // Required for static site generation
    images: {
      unoptimized: true, // Required for static export
    },
    basePath: '/Web-Thesis', // Replace with your repository name
  };
  
  module.exports = nextConfig;