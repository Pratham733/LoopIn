/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'loopinchat.firebasestorage.app',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'ui-avatars.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '9190',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                port: '',
                pathname: '/**',
            },
        ],
        domains: ['127.0.0.1', 'ui-avatars.com', 'res.cloudinary.com'],
    },
    // Add headers to handle CORS and localhost/127.0.0.1 issues
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization, X-Requested-With',
                    },
                    {
                        key: 'Access-Control-Allow-Credentials',
                        value: 'true',
                    },
                ],
            },
            // Add specific CORS headers for Firebase emulator communication
            {
                source: '/api/(.*)',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization, X-Requested-With',
                    },
                ],
            },
        ];
    },
    // Add redirects to handle localhost/127.0.0.1 issues
    async redirects() {
        return [
            // Redirect 127.0.0.1 to localhost to avoid CORS issues in development
            {
                source: '/(.*)',
                has: [
                    {
                        type: 'host',
                        value: '127.0.0.1:3000',
                    },
                ],
                destination: 'http://localhost:3000/:path*',
                permanent: false,
            },
        ];
    },
    // Handle Node.js modules for Firebase Admin SDK and Genkit dependencies
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Don't attempt to import server-only modules on the client
            config.resolve.fallback = {
                fs: false,
                path: false,
                os: false,
                crypto: false,
                child_process: false,
                net: false,
                tls: false,
                http2: false,
                'firebase-admin': false,
                '@opentelemetry/winston-transport': false,
                'handlebars': false,
            };
        }

        // Suppress webpack warnings for Genkit dependencies
        config.ignoreWarnings = [
            /Module not found: Can't resolve '@opentelemetry\/winston-transport'/,
            /require\.extensions is not supported by webpack/,
            /Can't resolve '@opentelemetry\/winston-transport' in/,
        ];

        // Handle Genkit AI dependencies
        config.externals = config.externals || [];
        if (typeof config.externals === 'function') {
            const originalExternals = config.externals;
            config.externals = (context, request, callback) => {
                if (request?.includes('@opentelemetry') || request?.includes('handlebars')) {
                    return callback(null, 'commonjs ' + request);
                }
                return originalExternals(context, request, callback);
            };
        }

        return config;
    },
};

module.exports = nextConfig;
