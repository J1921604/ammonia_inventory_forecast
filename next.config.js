/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/ammonia_inventory_forecast' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ammonia_inventory_forecast/' : '',
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.NODE_ENV === 'production' ? '/ammonia_inventory_forecast' : '',
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig
