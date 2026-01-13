/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === "true"
const repo = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split("/")[1] : ""
const isUserOrOrgSite = repo.endsWith(".github.io")

/**
 * GitHub Pages basePath rules:
 * - User/Org site repo (e.g. pixedar.github.io) is served from "/"  -> basePath=""
 * - Project site repo (e.g. my-portfolio) is served from "/my-portfolio" -> basePath="/my-portfolio"
 */
const basePath = isGithubActions && !isUserOrOrgSite ? `/${repo}` : ""

const nextConfig = {
  output: "export",
  trailingSlash: true,

  // Optional, but helps if you ever deploy this as a project page repo
  basePath,
  assetPrefix: basePath,

  // Make basePath available to client code (useful for static exports on GitHub Pages)
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
