import { getBehanceProjects } from '../lib/behance'

async function main() {
  const projects = await getBehanceProjects({ forceRefresh: true })
  console.log(`Parsed ${projects.length} projects.`)
}

main().catch((error) => {
  console.error('Failed to fetch Behance projects:', error)
  process.exit(1)
})
