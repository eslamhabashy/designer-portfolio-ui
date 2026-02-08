import { generateBehanceCacheFile } from '../lib/behance'

async function main() {
  const cache = await generateBehanceCacheFile()
  console.log(`Saved ${cache.projects.length} projects to public/behance-cache.json`)
}

main().catch((error) => {
  console.error('Failed to generate Behance cache file:', error)
  process.exit(1)
})
