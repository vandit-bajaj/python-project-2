import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DermaLens — Privacy-First Skin Wellness',
    short_name: 'DermaLens',
    description: 'On-device facial skin wellness analysis with zero cloud data egress.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#0d9488',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
