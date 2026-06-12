import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),

      canonical: z.string().optional(),

      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),

      description: z.string().optional(),

      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),

      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
    })
    .optional();

const postCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/data/post' }),
  schema: z.object({
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),

    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),

    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),

    metadata: metadataDefinition(),
  }),
});

// A page-builder page is a list of blocks. Each block carries a `_type`
// discriminator that BlockRenderer maps to a widget component. The block's
// own fields are validated by CloudCannon's structures (cloudcannon.config.yml),
// so the Zod schema here stays permissive — this avoids YAML empty-field (`null`)
// rejections from per-field `.optional()` rules during editing.
const contentBlock = z.object({ _type: z.string() }).passthrough();

const pagesCollection = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: 'src/content/pages' }),
  schema: z.object({
    _schema: z.string().optional(),
    title: z.string().optional(),
    draft: z.boolean().optional(),
    // Which top-level layout to render. Defaults by convention in the
    // catch-all route (landing/* → LandingLayout, otherwise PageLayout).
    layout: z.enum(['PageLayout', 'LandingLayout']).optional(),
    metadata: metadataDefinition(),
    content_blocks: z.array(contentBlock).optional(),
  }),
});

const legalCollection = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/legal' }),
  schema: z.object({
    _schema: z.string().optional(),
    title: z.string(),
    metadata: metadataDefinition(),
  }),
});

export const collections = {
  post: postCollection,
  pages: pagesCollection,
  legal: legalCollection,
};
