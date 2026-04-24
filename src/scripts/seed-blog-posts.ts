import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createBlogPostWorkflow } from "../workflows/create-blog-post"

type SeedPost = {
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  author: string
}

const POSTS: SeedPost[] = [
  {
    title: "How to Choose the Right Laptop in 2026",
    slug: "how-to-choose-the-right-laptop-in-2026",
    excerpt:
      "Refurbished, gaming, 2-in-1, or ultra-portable? A no-nonsense buyer's guide to picking the laptop that actually fits your life.",
    cover_image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=80",
    author: "The Editors",
    content: `
      <h2>Start with how you actually use a laptop</h2>
      <p>Before you get sucked into spec sheets, ask yourself one question: <strong>what do I spend most of my time doing on a computer?</strong> Email and spreadsheets need a very different machine than 3D games or video editing.</p>
      <p>Most buyers fall into one of four groups:</p>
      <ul>
        <li><strong>Office &amp; study</strong> — email, docs, video calls, browsing. Almost any modern laptop handles this well.</li>
        <li><strong>Creators</strong> — photo, video, 3D. You need RAM (16GB+), a fast SSD, and ideally a discrete GPU.</li>
        <li><strong>Gamers</strong> — dedicated GPU is non-negotiable. RTX 4060 is the current sweet spot.</li>
        <li><strong>Travelers</strong> — weight and battery life matter more than raw power.</li>
      </ul>
      <h2>The four specs that really matter</h2>
      <p>Ignore marketing. For 95% of buyers, these are the only numbers that matter:</p>
      <ol>
        <li><strong>RAM:</strong> 16GB is the new 8GB. Don't buy less unless it's a Chromebook.</li>
        <li><strong>Storage:</strong> 512GB SSD minimum. 256GB fills up faster than you'd think.</li>
        <li><strong>Display:</strong> Full HD (1920×1080) or higher, IPS panel. OLED is gorgeous if the budget allows.</li>
        <li><strong>Battery:</strong> Look for 10+ hours of real-world use — review benchmarks, not manufacturer claims.</li>
      </ol>
      <h2>Refurbished vs. new</h2>
      <p>A professionally refurbished business laptop (ThinkPad, EliteBook, Latitude) from 2–3 years ago will outperform a new budget laptop at the same price — and be built better. It's the smartest money move in computing.</p>
      <p>Just make sure your seller offers a <em>real warranty</em> (12 months is standard) and that the battery has been tested or replaced.</p>
      <h2>The bottom line</h2>
      <p>Buy for what you do today, not what you <em>might</em> do in three years. You can always upgrade. The best laptop is the one that disappears while you work.</p>
    `.trim(),
  },
  {
    title: "Refurbished Laptops: Everything You Need to Know",
    slug: "refurbished-laptops-everything-you-need-to-know",
    excerpt:
      "Refurbished doesn't mean used-and-sketchy. Here's exactly what happens to a laptop before it reaches your desk — and why it's often a smarter buy than new.",
    cover_image:
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1600&q=80",
    author: "Maya R.",
    content: `
      <h2>What does "refurbished" actually mean?</h2>
      <p>At a reputable shop, refurbished laptops go through a standardized process:</p>
      <ol>
        <li><strong>Full hardware test</strong> — every port, key, and sensor.</li>
        <li><strong>Secure data wipe</strong> — to industry standards (DoD, NIST).</li>
        <li><strong>Battery health check</strong> — replaced if below 80% capacity.</li>
        <li><strong>Professional cleaning</strong> — inside and out.</li>
        <li><strong>OS reinstall</strong> — fresh copy of Windows or the latest macOS.</li>
      </ol>
      <h2>Why buy refurbished?</h2>
      <ul>
        <li><strong>Save 30–60%</strong> vs. buying new.</li>
        <li><strong>Get better hardware</strong> for the money — business-class keyboards, aluminum chassis, enterprise-grade reliability.</li>
        <li><strong>It's greener</strong> — extending a laptop's life by one year saves roughly 190kg of CO₂.</li>
      </ul>
      <h2>What to check before you buy</h2>
      <p>Three things separate a legit refurb from a junk sale:</p>
      <ul>
        <li><strong>Warranty</strong> — 12 months is the standard. Less is a red flag.</li>
        <li><strong>Battery health</strong> — ask for the percentage. 85%+ is great, under 70% means a replacement is imminent.</li>
        <li><strong>Cosmetic grade</strong> — "Good" means visible wear, "Excellent" means near-new. Both work identically.</li>
      </ul>
      <p>Done right, refurbished gives you enterprise-grade hardware at consumer prices. It's one of the best-value categories in the whole industry.</p>
    `.trim(),
  },
  {
    title: "Gaming Laptop Buying Guide 2026",
    slug: "gaming-laptop-buying-guide-2026",
    excerpt:
      "RTX 4060? 4070? 240Hz? We cut through the acronyms and tell you exactly which specs actually affect your frame rate.",
    cover_image:
      "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1600&q=80",
    author: "Jordan K.",
    content: `
      <h2>The GPU is everything</h2>
      <p>If you only remember one thing from this guide: <strong>the GPU determines 90% of your gaming experience</strong>. Don't compromise here.</p>
      <p>For 2026, the sweet spots are:</p>
      <ul>
        <li><strong>RTX 4050</strong> — entry-level. Great for e-sports and 1080p medium settings.</li>
        <li><strong>RTX 4060</strong> — the value champion. Runs nearly everything at 1080p high, or 1440p medium.</li>
        <li><strong>RTX 4070</strong> — 1440p sweet spot with ray tracing.</li>
        <li><strong>RTX 4080/4090</strong> — 4K gaming and creative work. Expensive.</li>
      </ul>
      <h2>Screen specs that matter</h2>
      <p>A fast GPU paired with a 60Hz display is a waste. Aim for:</p>
      <ul>
        <li><strong>144Hz or higher</strong> — once you try it, you can't go back.</li>
        <li><strong>1440p on 15"+ screens</strong> — noticeably sharper than 1080p, and the GPU can usually drive it.</li>
        <li><strong>G-Sync or FreeSync</strong> — eliminates screen tearing.</li>
      </ul>
      <h2>Don't forget the boring stuff</h2>
      <p>Cooling is what separates a good gaming laptop from a great one. If the reviews mention thermal throttling or fan noise like a jet engine, keep looking.</p>
      <p>Battery life on gaming laptops is universally bad — plan on being near an outlet. The best you'll get unplugged is 4–6 hours of light use.</p>
      <h2>Our current picks</h2>
      <p>The <strong>ASUS ROG Strix G16</strong> is our benchmark for serious gamers. The <strong>Lenovo Legion Pro 5</strong> offers 90% of the performance for less money. On a tight budget? The <strong>MSI Katana 15</strong> is shockingly capable.</p>
    `.trim(),
  },
  {
    title: "2-in-1 Laptops vs. Traditional Laptops: Which Is Right for You?",
    slug: "2-in-1-laptops-vs-traditional-laptops",
    excerpt:
      "Convertibles promise the best of both worlds — but the trade-offs are real. Here's when a 2-in-1 is worth it, and when you should just buy a regular laptop.",
    cover_image:
      "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?auto=format&fit=crop&w=1600&q=80",
    author: "Priya S.",
    content: `
      <h2>What is a 2-in-1?</h2>
      <p>A 2-in-1 (or "convertible") is a laptop whose screen either detaches completely or folds back 360° to become a tablet. The category spans two very different designs:</p>
      <ul>
        <li><strong>Convertibles</strong> (e.g. HP Spectre x360, Lenovo Yoga) — the keyboard stays attached, but the screen rotates back.</li>
        <li><strong>Detachables</strong> (e.g. Microsoft Surface Pro) — the keyboard pops off entirely, leaving just a tablet.</li>
      </ul>
      <h2>Who 2-in-1s are perfect for</h2>
      <ul>
        <li><strong>Students</strong> — taking handwritten notes with a stylus is genuinely better than typing for math, diagrams, and quick sketches.</li>
        <li><strong>Designers &amp; artists</strong> — pressure-sensitive pens transform a laptop into a drawing tablet.</li>
        <li><strong>Presenters</strong> — tent mode is great for sharing a screen across a table.</li>
        <li><strong>Casual travelers</strong> — one device that replaces laptop + tablet.</li>
      </ul>
      <h2>The trade-offs</h2>
      <p>Nothing is free. Here's what you give up:</p>
      <ul>
        <li><strong>Weight</strong> — touchscreens add 100–200g.</li>
        <li><strong>Battery life</strong> — convertibles typically run 1–2 hours less than equivalent laptops.</li>
        <li><strong>Price</strong> — expect a 15–25% premium for the hinge and touchscreen.</li>
        <li><strong>Keyboard feel</strong> — detachables have noticeably worse typing than clamshells.</li>
      </ul>
      <h2>The verdict</h2>
      <p>If you'll use the tablet mode more than once a week, a 2-in-1 is worth it. If not — buy a traditional laptop and a cheap iPad. You'll end up happier.</p>
    `.trim(),
  },
  {
    title: "The Best Laptop Accessories Every Student Needs",
    slug: "best-laptop-accessories-for-students",
    excerpt:
      "Your laptop is half the setup. These are the accessories that will make you faster, more comfortable, and less likely to destroy your spine.",
    cover_image:
      "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1600&q=80",
    author: "Sam L.",
    content: `
      <h2>The essentials</h2>
      <ol>
        <li><strong>A proper laptop stand</strong> — raises the screen to eye level. Your neck will thank you in ten years.</li>
        <li><strong>External keyboard &amp; mouse</strong> — once the laptop is on a stand, you need these anyway. Get a mechanical keyboard if you type a lot.</li>
        <li><strong>USB-C hub</strong> — ultrabooks are port-starved. A good hub adds HDMI, USB-A, SD card, and ethernet.</li>
        <li><strong>Noise-cancelling headphones</strong> — libraries, cafés, dorms. Non-negotiable.</li>
      </ol>
      <h2>The upgrades</h2>
      <ul>
        <li><strong>Second monitor</strong> — the single biggest productivity upgrade you can buy. A cheap 24" 1080p IPS is under €120.</li>
        <li><strong>External SSD</strong> — cheap, fast backup. Essential before your first all-nighter disaster.</li>
        <li><strong>Webcam</strong> — built-in laptop webcams are almost universally bad. A Logitech C920 transforms video calls.</li>
      </ul>
      <h2>The "nice to haves"</h2>
      <p>Once the basics are covered, consider:</p>
      <ul>
        <li>A Kensington lock (if you study in public spaces)</li>
        <li>A power bank with PD output (for long library sessions)</li>
        <li>A padded laptop sleeve (your backpack zipper is not enough)</li>
      </ul>
      <h2>What to skip</h2>
      <p>Ignore the gimmicks: RGB mouse pads, vertical laptop stands, and "ergonomic" keyboards that require a training manual. Spend the money on a real office chair instead.</p>
    `.trim(),
  },
  {
    title: "How to Extend Your Laptop's Lifespan",
    slug: "how-to-extend-your-laptops-lifespan",
    excerpt:
      "A well-cared-for laptop easily lasts 6–8 years. A neglected one dies in 2. Here's what actually makes the difference.",
    cover_image:
      "https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=1600&q=80",
    author: "Maya R.",
    content: `
      <h2>Battery: the #1 thing people get wrong</h2>
      <p>Lithium batteries hate two things: being fully charged and being fully empty. For maximum lifespan:</p>
      <ul>
        <li>Keep charge between <strong>20% and 80%</strong> when possible.</li>
        <li>Use battery-limit software (most laptops have it built-in) to cap charging at 80%.</li>
        <li>If you'll be plugged in for weeks, set the cap to 60%.</li>
        <li>Avoid letting it die completely.</li>
      </ul>
      <h2>Heat kills everything</h2>
      <p>Every 10°C above 70°C roughly halves your laptop's component lifespan. To keep it cool:</p>
      <ul>
        <li><strong>Clean the vents</strong> every 6–12 months. A can of compressed air works wonders.</li>
        <li><strong>Don't block the intake</strong> — no laptops on beds or couches for extended sessions.</li>
        <li>If you game or compile often, a <strong>laptop cooling pad</strong> is worth the €30.</li>
      </ul>
      <h2>Software hygiene</h2>
      <ul>
        <li><strong>Reinstall the OS every 2–3 years.</strong> Windows especially accumulates cruft. Back up, wipe, reinstall — it feels brand new.</li>
        <li><strong>Keep 20%+ free disk space.</strong> SSDs slow down dramatically when nearly full.</li>
        <li><strong>Update firmware and drivers</strong> — but wait a week or two to make sure the update isn't buggy.</li>
      </ul>
      <h2>Physical care</h2>
      <p>Use a sleeve. Don't eat over the keyboard. Don't carry it by the screen. Shut the lid gently. Basic stuff — but almost every "my laptop broke" story traces back to one of these.</p>
      <p>Do all this, and a decent laptop will easily outlast its warranty three times over.</p>
    `.trim(),
  },
]

export default async function seedBlogPosts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: existing } = await query.graph({
    entity: "blog_post",
    fields: ["id", "slug"],
  })
  const existingSlugs = new Set(existing.map((p: any) => p.slug))

  let created = 0
  let skipped = 0

  for (const post of POSTS) {
    if (existingSlugs.has(post.slug)) {
      logger.info(`Blog post with slug "${post.slug}" already exists, skipping.`)
      skipped += 1
      continue
    }

    await createBlogPostWorkflow(container).run({
      input: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        cover_image: post.cover_image,
        author: post.author,
        status: "published",
      },
    })

    logger.info(`Created blog post: "${post.title}".`)
    created += 1
  }

  logger.info(`Done. Created ${created} post(s), skipped ${skipped}.`)
}
