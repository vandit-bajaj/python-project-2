import type { MetricId } from '@/shared/types';

export * from './utils';
export * from './redness';
export * from './acne';
export * from './pigmentation';
export * from './oiliness';
export * from './texture';
export * from './under-eye';
export * from './fine-lines';
export * from './evenness';

export interface MetricMetadata {
  id: MetricId;
  name: string;
  category: 'clarity' | 'balance' | 'texture' | 'uniformity';
  description: string;
}

export const METRICS_METADATA: Record<MetricId, MetricMetadata> = {
  redness: {
    id: 'redness',
    name: 'Redness & Erythema',
    category: 'balance',
    description: 'Erythema and skin reactivity measured against personal baseline.',
  },
  acne: {
    id: 'acne',
    name: 'Blemishes & Breakouts',
    category: 'clarity',
    description: 'Localized papules, pustules, and comedone density.',
  },
  pigmentation: {
    id: 'pigmentation',
    name: 'Pigmentation & Spots',
    category: 'uniformity',
    description: 'Melanin distribution, sun spots, and hyperpigmentation contrast.',
  },
  oiliness: {
    id: 'oiliness',
    name: 'Oiliness & Shine',
    category: 'balance',
    description: 'Specular reflection and sebum balance across facial zones.',
  },
  texture: {
    id: 'texture',
    name: 'Texture & Pores',
    category: 'texture',
    description: 'Surface smoothness and visible pore prominence.',
  },
  underEyeDarkness: {
    id: 'underEyeDarkness',
    name: 'Under-Eye Vitality',
    category: 'clarity',
    description: 'Periorbital tone deficit relative to cheek baseline.',
  },
  fineLines: {
    id: 'fineLines',
    name: 'Fine Lines & Creases',
    category: 'texture',
    description: 'Linear crease density on dynamic expression zones.',
  },
  evenness: {
    id: 'evenness',
    name: 'Tone Evenness',
    category: 'uniformity',
    description: 'Global spatial color and luminance distribution.',
  },
};
