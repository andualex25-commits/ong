import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type HeroContent = {
  id: string;
  page: string;
  eyebrow?: string;
  title: string;
  description?: string;
  cta_primary_text?: string;
  cta_primary_link?: string;
  cta_secondary_text?: string;
  cta_secondary_link?: string;
  image_url?: string;
};

export type MissionCard = {
  id: string;
  number: number;
  title: string;
  description?: string;
  order_index?: number;
};

export type BeneficiaryStory = {
  id: string;
  title: string;
  age?: number;
  tag?: string;
  description?: string;
  image_url?: string;
  order_index?: number;
};

export type FeaturedProject = {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  image_url?: string;
  location?: string;
  target_age?: string;
  status?: string;
  cta_primary_text?: string;
  cta_primary_link?: string;
  cta_secondary_text?: string;
  cta_secondary_link?: string;
};
