import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://cosmos-finder.vercel.app",
      lastModified: new Date(),
    },
    {
      url: "https://cosmos-finder.vercel.app/explore",
      lastModified: new Date(),
    },
  ];
}
